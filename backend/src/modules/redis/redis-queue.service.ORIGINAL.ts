import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue, Processor, Process } from '@nestjs/bull';
import { Queue, Job, JobOptions } from 'bull';
import { JobQueue } from '../../entities/job-queue.entity';
import { JobExecution, ExecutionStatus } from '../../entities/job-execution.entity';
import { JobQueuesGateway } from '../job-queues/job-queues.gateway';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export interface JobData {
  jobQueueId: string;
  executionId: string;
  scriptPath: string;
  scriptType: string;
  environmentVars: Record<string, string>;
  timeoutSeconds: number;
  metadata?: Record<string, any>;
}

export interface JobResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTimeMs: number;
  exitCode?: number;
}

@Injectable()
@Processor('job-processor')
export class RedisQueueService implements OnModuleInit {
  private readonly logger = new Logger(RedisQueueService.name);

  constructor(
    @InjectQueue('job-processor') private jobQueue: Queue,
    @InjectRepository(JobExecution)
    private jobExecutionRepository: Repository<JobExecution>,
    @InjectRepository(JobQueue)
    private jobQueueRepository: Repository<JobQueue>,
    private jobQueuesGateway: JobQueuesGateway,
  ) {}

  async onModuleInit() {
    // Configurar listeners para eventos da fila
    this.setupQueueListeners();
    this.logger.log('Redis Queue Service initialized');
  }

  private setupQueueListeners() {
    // Job adicionado à fila
    this.jobQueue.on('waiting', (jobId: string) => {
      this.logger.log(`Job ${jobId} adicionado à fila`);
    });

    // Job iniciado
    this.jobQueue.on('active', (job: Job) => {
      this.logger.log(`Job ${job.id} iniciado`);
    });

    // Job concluído
    this.jobQueue.on('completed', (job: Job, result: JobResult) => {
      this.logger.log(`Job ${job.id} concluído com sucesso`);
    });

    // Job falhou
    this.jobQueue.on('failed', (job: Job, err: Error) => {
      this.logger.error(`Job ${job.id} falhou:`, err.message);
    });

    // Job travado
    this.jobQueue.on('stalled', (job: Job) => {
      this.logger.warn(`Job ${job.id} travado, será reprocessado`);
    });

    // Progresso do job
    this.jobQueue.on('progress', (job: Job, progress: number) => {
      this.logger.debug(`Job ${job.id} progresso: ${progress}%`);
    });
  }

  // Adicionar job à fila
  async addJob(
    jobQueue: JobQueue,
    executionId: string,
    options: Partial<JobOptions> = {}
  ): Promise<Job<JobData>> {
    const jobData: JobData = {
      jobQueueId: jobQueue.id,
      executionId,
      scriptPath: jobQueue.scriptPath,
      scriptType: jobQueue.scriptType,
      environmentVars: jobQueue.environmentVars || {},
      timeoutSeconds: jobQueue.timeoutSeconds || 300,
      metadata: {}
    };

    const jobOptions: JobOptions = {
      attempts: jobQueue.maxRetries || 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      delay: options.delay || 0,
      priority: options.priority || 0,
      removeOnComplete: 50,
      removeOnFail: 100,
      ...options
    };

    const job = await this.jobQueue.add('execute-script', jobData, jobOptions);

    this.logger.log(`Job ${job.id} adicionado à fila para execução: ${jobQueue.name}`);

    return job;
  }

  // Processar job
  @Process('execute-script')
  async handleExecuteScript(job: Job<JobData>): Promise<JobResult> {
    const { jobQueueId, executionId, scriptPath, scriptType, environmentVars, timeoutSeconds } = job.data;
    const startTime = Date.now();

    try {
      // Buscar dados da execução
      const execution = await this.jobExecutionRepository.findOne({
        where: { id: executionId },
        relations: ['jobQueue']
      });

      if (!execution) {
        throw new Error(`Execução ${executionId} não encontrada`);
      }

      // Atualizar status para running
      execution.status = ExecutionStatus.RUNNING;
      execution.startedAt = new Date();
      await this.jobExecutionRepository.save(execution);

      // Notificar início
      this.jobQueuesGateway.notifyJobStarted(execution, execution.jobQueue);

      // Executar script
      const result = await this.executeScript(job.data, job);

      // Atualizar execução com sucesso
      execution.status = ExecutionStatus.COMPLETED;
      execution.completedAt = new Date();
      execution.executionTimeMs = result.executionTimeMs;
      execution.outputLog = result.output || '';
      execution.errorLog = result.error || '';
      await this.jobExecutionRepository.save(execution);

      // Notificar conclusão
      this.jobQueuesGateway.notifyJobCompleted(execution, execution.jobQueue);

      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;

      // Buscar execução para atualizar
      const execution = await this.jobExecutionRepository.findOne({
        where: { id: executionId },
        relations: ['jobQueue']
      });

      if (execution) {
        execution.status = ExecutionStatus.FAILED;
        execution.completedAt = new Date();
        execution.executionTimeMs = executionTime;
        execution.errorLog = error.message;
        await this.jobExecutionRepository.save(execution);

        // Notificar falha
        this.jobQueuesGateway.notifyJobFailed(execution, execution.jobQueue, error.message);
      }

      throw error;
    }
  }

  private async executeScript(jobData: JobData, job: Job): Promise<JobResult> {
    const { scriptPath, scriptType, environmentVars, timeoutSeconds } = jobData;
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      let command: string;
      let args: string[] = [];
      let output = '';
      let error = '';

      // Determinar comando baseado no tipo
      switch (scriptType) {
        case 'shell':
          command = 'bash';
          args = [scriptPath];
          break;
        case 'node':
          command = 'node';
          args = [scriptPath];
          break;
        case 'python':
          command = 'python3';
          args = [scriptPath];
          break;
        default:
          return reject(new Error(`Tipo de script não suportado: ${scriptType}`));
      }

      // Verificar se arquivo existe
      if (!fs.existsSync(scriptPath)) {
        return reject(new Error(`Script não encontrado: ${scriptPath}`));
      }

      // Executar processo
      const childProcess = spawn(command, args, {
        env: {
          ...process.env,
          ...environmentVars,
          JOB_ID: job.id.toString(),
          EXECUTION_ID: jobData.executionId,
          JOB_QUEUE_ID: jobData.jobQueueId,
        },
        cwd: path.dirname(scriptPath),
      });

      // Configurar timeout
      const timeoutId = setTimeout(() => {
        childProcess.kill('SIGTERM');
        reject(new Error('Execução excedeu o tempo limite'));
      }, timeoutSeconds * 1000);

      // Capturar output
      childProcess.stdout.on('data', (data) => {
        output += data.toString();
        // Reportar progresso baseado na saída (simples)
        const lines = output.split('\n').length;
        job.progress(Math.min(lines * 2, 90)); // Progresso estimado
      });

      childProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      // Finalização
      childProcess.on('close', (code) => {
        clearTimeout(timeoutId);
        const executionTime = Date.now() - startTime;

        job.progress(100); // 100% concluído

        if (code === 0) {
          resolve({
            success: true,
            output,
            error: error || undefined,
            executionTimeMs: executionTime,
            exitCode: code,
          });
        } else {
          reject(new Error(`Script falhou com código ${code}: ${error}`));
        }
      });

      childProcess.on('error', (err) => {
        clearTimeout(timeoutId);
        reject(err);
      });
    });
  }

  // Métodos utilitários para monitoramento
  async getQueueStats() {
    const waiting = await this.jobQueue.getWaiting();
    const active = await this.jobQueue.getActive();
    const completed = await this.jobQueue.getCompleted();
    const failed = await this.jobQueue.getFailed();
    const delayed = await this.jobQueue.getDelayed();
    const paused = await this.jobQueue.isPaused();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      paused,
      total: waiting.length + active.length + completed.length + failed.length + delayed.length,
    };
  }

  async getJob(jobId: string): Promise<Job | null> {
    return this.jobQueue.getJob(jobId);
  }

  async removeJob(jobId: string): Promise<void> {
    const job = await this.getJob(jobId);
    if (job) {
      await job.remove();
    }
  }

  async retryJob(jobId: string): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} não encontrado`);
    }
    await job.retry();
  }

  async pauseQueue(): Promise<void> {
    await this.jobQueue.pause();
    this.logger.log('Fila pausada');
  }

  async resumeQueue(): Promise<void> {
    await this.jobQueue.resume();
    this.logger.log('Fila resumida');
  }

  async cleanQueue(grace: number = 5000): Promise<void> {
    await this.jobQueue.clean(grace, 'completed');
    await this.jobQueue.clean(grace, 'failed');
    this.logger.log('Fila limpa');
  }

  async getQueueHealth() {
    try {
      const stats = await this.getQueueStats();
      const isPaused = await this.jobQueue.isPaused();

      return {
        healthy: true,
        paused: isPaused,
        stats,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }
}