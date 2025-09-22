import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { DockerJob, JobType, JobStatus } from '../entities/docker-job.entity';
import { User } from '../../../entities/user.entity';

@Injectable()
@Processor('docker')
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectRepository(DockerJob)
    private jobsRepo: Repository<DockerJob>,
    @InjectQueue('docker')
    private dockerQueue: Queue
  ) {}

  async createJob(
    type: JobType,
    resourceType: string,
    resourceId: string,
    parameters: any,
    user: User
  ): Promise<DockerJob> {
    // Criar registro do job
    const job = this.jobsRepo.create({
      type,
      resource_type: resourceType,
      resource_id: resourceId,
      parameters,
      user,
      status: 'pending' as JobStatus,
      progress: 0
    });

    const savedJob = await this.jobsRepo.save(job);

    // Enfileirar job
    await this.dockerQueue.add(`docker-${type}`, {
      jobId: savedJob.id,
      type,
      resourceType,
      resourceId,
      parameters,
      userId: user.id
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });

    return savedJob;
  }

  async getJob(jobId: string): Promise<DockerJob> {
    const job = await this.jobsRepo.findOne({
      where: { id: jobId },
      relations: ['user']
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return job;
  }

  async getJobs(filters?: {
    user_id?: string;
    type?: JobType;
    status?: JobStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ jobs: DockerJob[]; total: number }> {
    const query = this.jobsRepo.createQueryBuilder('job')
      .leftJoinAndSelect('job.user', 'user')
      .orderBy('job.created_at', 'DESC');

    if (filters?.user_id) {
      query.andWhere('job.user_id = :userId', { userId: filters.user_id });
    }

    if (filters?.type) {
      query.andWhere('job.type = :type', { type: filters.type });
    }

    if (filters?.status) {
      query.andWhere('job.status = :status', { status: filters.status });
    }

    const total = await query.getCount();

    if (filters?.limit) {
      query.limit(filters.limit);
    }

    if (filters?.offset) {
      query.offset(filters.offset);
    }

    const jobs = await query.getMany();

    return { jobs, total };
  }

  async updateJobProgress(jobId: string, progress: number, message?: string): Promise<void> {
    const updateData: any = {
      progress,
      status: progress === 100 ? 'completed' as JobStatus : 'running' as JobStatus
    };

    if (message) {
      updateData.message = message;
    }

    if (progress === 100) {
      updateData.completed_at = new Date();
    }

    await this.jobsRepo.update(jobId, updateData);
  }

  async completeJob(jobId: string, result: any): Promise<void> {
    await this.jobsRepo.update(jobId, {
      status: 'completed' as JobStatus,
      progress: 100,
      result,
      completed_at: new Date()
    });
  }

  async failJob(jobId: string, error: string): Promise<void> {
    await this.jobsRepo.update(jobId, {
      status: 'failed' as JobStatus,
      error,
      completed_at: new Date()
    });
  }

  // Processadores de Jobs
  @Process('docker-backup')
  async processVolumeBackup(job: Job<any>): Promise<void> {
    const { jobId, resourceId, parameters } = job.data;

    try {
      await this.updateJobProgress(jobId, 10, 'Iniciando backup do volume...');

      // TODO: Implementar backup real do volume
      // Por enquanto, simulação
      await this.simulateBackup(jobId);

      await this.completeJob(jobId, {
        backup_file: `/backups/${resourceId}_${Date.now()}.tar.gz`,
        backup_size: 1024 * 1024 * 100, // 100MB simulado
        backup_hash: 'sha256:abcdef123456'
      });

    } catch (error) {
      this.logger.error(`Backup job ${jobId} failed`, error);
      await this.failJob(jobId, error.message);
    }
  }

  @Process('docker-restore')
  async processVolumeRestore(job: Job<any>): Promise<void> {
    const { jobId, resourceId, parameters } = job.data;

    try {
      await this.updateJobProgress(jobId, 10, 'Iniciando restore do volume...');

      // TODO: Implementar restore real do volume
      await this.simulateRestore(jobId);

      await this.completeJob(jobId, {
        restored_volume: resourceId,
        restored_from: parameters.backup_id
      });

    } catch (error) {
      this.logger.error(`Restore job ${jobId} failed`, error);
      await this.failJob(jobId, error.message);
    }
  }

  @Process('docker-pull')
  async processImagePull(job: Job<any>): Promise<void> {
    const { jobId, resourceId, parameters } = job.data;

    try {
      await this.updateJobProgress(jobId, 5, `Fazendo pull da imagem ${resourceId}...`);

      // TODO: Implementar pull real da imagem
      await this.simulatePull(jobId);

      await this.completeJob(jobId, {
        image: resourceId,
        pulled_at: new Date()
      });

    } catch (error) {
      this.logger.error(`Pull job ${jobId} failed`, error);
      await this.failJob(jobId, error.message);
    }
  }

  @Process('docker-prune')
  async processPrune(job: Job<any>): Promise<void> {
    const { jobId, resourceType, parameters } = job.data;

    try {
      await this.updateJobProgress(jobId, 10, `Iniciando limpeza de ${resourceType}...`);

      // TODO: Implementar prune real
      await this.simulatePrune(jobId);

      await this.completeJob(jobId, {
        resource_type: resourceType,
        items_removed: 5,
        space_reclaimed: 1024 * 1024 * 500 // 500MB simulado
      });

    } catch (error) {
      this.logger.error(`Prune job ${jobId} failed`, error);
      await this.failJob(jobId, error.message);
    }
  }

  // Métodos de simulação (substituir por implementação real)
  private async simulateBackup(jobId: string): Promise<void> {
    const steps = [20, 40, 60, 80, 95, 100];
    const messages = [
      'Criando snapshot do volume...',
      'Comprimindo dados...',
      'Calculando hash...',
      'Transferindo para storage...',
      'Finalizando backup...',
      'Backup concluído com sucesso!'
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular trabalho
      await this.updateJobProgress(jobId, steps[i], messages[i]);
    }
  }

  private async simulateRestore(jobId: string): Promise<void> {
    const steps = [20, 40, 60, 80, 95, 100];
    const messages = [
      'Validando backup...',
      'Descomprimindo dados...',
      'Verificando integridade...',
      'Restaurando volume...',
      'Finalizando restore...',
      'Restore concluído com sucesso!'
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.updateJobProgress(jobId, steps[i], messages[i]);
    }
  }

  private async simulatePull(jobId: string): Promise<void> {
    const steps = [15, 30, 50, 70, 85, 95, 100];
    const messages = [
      'Conectando ao registry...',
      'Verificando camadas...',
      'Baixando camadas...',
      'Extraindo camadas...',
      'Configurando imagem...',
      'Finalizando...',
      'Pull concluído com sucesso!'
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      await this.updateJobProgress(jobId, steps[i], messages[i]);
    }
  }

  private async simulatePrune(jobId: string): Promise<void> {
    const steps = [25, 50, 75, 100];
    const messages = [
      'Identificando recursos não utilizados...',
      'Calculando espaço a ser liberado...',
      'Removendo recursos...',
      'Limpeza concluída!'
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await this.updateJobProgress(jobId, steps[i], messages[i]);
    }
  }
}