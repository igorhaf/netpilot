import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue, Processor, Process } from '@nestjs/bull';
import { Queue, Job, JobOptions } from 'bull';
import { JobQueue } from '../../entities/job-queue.entity';
import { JobExecution, ExecutionStatus } from '../../entities/job-execution.entity';
import { JobQueuesGateway } from '../job-queues/job-queues.gateway';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

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
  private readonly systemOpsUrl: string;

  constructor(
    @InjectQueue('job-processor') private jobQueue: Queue,
    @InjectRepository(JobExecution)
    private jobExecutionRepository: Repository<JobExecution>,
    @InjectRepository(JobQueue)
    private jobQueueRepository: Repository<JobQueue>,
    private jobQueuesGateway: JobQueuesGateway,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    // URL do microserviço Python
    this.systemOpsUrl = this.configService.get('SYSTEM_OPS_URL', 'http://localhost:8001');
  }

  async onModuleInit() {
    // Configurar listeners para eventos da fila
    this.setupQueueListeners();
    this.logger.log('Redis Queue Service initialized with System Ops integration');
  }

  private setupQueueListeners() {
    this.jobQueue.on('waiting', (jobId) => {
      this.logger.log(`Job ${jobId} está aguardando processamento`);
    });

    this.jobQueue.on('active', (job) => {
      this.logger.log(`Job ${job.id} iniciou processamento`);
    });

    this.jobQueue.on('completed', (job, result) => {
      this.logger.log(`Job ${job.id} completado com sucesso`);
    });

    this.jobQueue.on('failed', (job, err) => {
      this.logger.error(`Job ${job.id} falhou: ${err.message}`);
    });
  }

  async addJob(
    jobQueue: JobQueue,
    executionId: string,
    metadata?: Record<string, any>,
    options?: JobOptions
  ): Promise<Job> {
    const jobData: JobData = {
      jobQueueId: jobQueue.id,
      executionId,
      scriptPath: jobQueue.scriptPath,
      scriptType: jobQueue.scriptType,
      environmentVars: jobQueue.environmentVars || {},
      timeoutSeconds: jobQueue.timeoutSeconds || 300,
      metadata
    };

    const jobOptions: JobOptions = {
      delay: options?.delay || 0,
      attempts: options?.attempts || 3,
      backoff: options?.backoff || { type: 'exponential', delay: 2000 },
      removeOnComplete: 10,
      removeOnFail: 5,
      ...options
    };

    const job = await this.jobQueue.add('execute-script', jobData, jobOptions);

    this.logger.log(`Job ${job.id} adicionado à fila para execução: ${jobQueue.name}`);
    return job;
  }

  @Process('execute-script')
  async processJob(job: Job<JobData>): Promise<JobResult> {
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

      // Marcar como executando
      execution.status = ExecutionStatus.RUNNING;
      execution.startedAt = new Date();
      await this.jobExecutionRepository.save(execution);

      // Notificar início via WebSocket
      this.jobQueuesGateway.notifyJobStarted(execution, execution.jobQueue);

      // NOVA IMPLEMENTAÇÃO: Chamar Python ao invés de executar diretamente
      const result = await this.executeScriptViaPython(job.data, job);

      // Atualizar execução com sucesso
      execution.status = ExecutionStatus.COMPLETED;
      execution.completedAt = new Date();
      execution.executionTimeMs = result.executionTimeMs;
      execution.outputLog = result.output || '';
      execution.errorLog = result.error || '';
      await this.jobExecutionRepository.save(execution);

      // Notificar conclusão via WebSocket
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

        // Notificar falha via WebSocket
        this.jobQueuesGateway.notifyJobFailed(execution, execution.jobQueue, error.message);
      }

      throw error;
    }
  }

  /**
   * NOVA IMPLEMENTAÇÃO: Executa script via microserviço Python
   * Substitui a execução direta via spawn()
   */
  private async executeScriptViaPython(jobData: JobData, job: Job): Promise<JobResult> {
    const { scriptPath, scriptType, environmentVars, timeoutSeconds, executionId } = jobData;

    try {
      this.logger.log(`🐍 Delegando execução para Python: ${scriptPath}`);

      // Preparar dados para o microserviço Python
      const requestData = {
        scriptPath,
        scriptType,
        environmentVars: {
          ...environmentVars,
          JOB_ID: job.id.toString(),
          EXECUTION_ID: executionId,
          JOB_QUEUE_ID: jobData.jobQueueId,
        },
        timeoutSeconds,
        jobId: job.id.toString(),
        executionId
      };

      // Fazer requisição para o microserviço Python
      const response = await firstValueFrom(
        this.httpService.post(`${this.systemOpsUrl}/jobs/execute`, requestData, {
          timeout: (timeoutSeconds + 10) * 1000, // Timeout da requisição HTTP
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getSystemOpsToken()}`
          }
        })
      );

      const result = response.data as any;

      // Atualizar progresso do job baseado na resposta
      job.progress(100);

      this.logger.log(`✅ Script executado via Python com sucesso: ${scriptPath}`);

      return {
        success: result.success || false,
        output: result.output || '',
        error: result.error || undefined,
        executionTimeMs: result.executionTimeMs || 0,
        exitCode: result.exitCode || 0,
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao executar script via Python: ${error.message}`);

      // Se for erro de HTTP, extrair detalhes
      if (error.response) {
        const httpError = error.response.data;
        throw new Error(`Sistema Python falhou: ${httpError.detail || httpError.message || error.message}`);
      }

      // Se for erro de timeout ou conexão
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Microserviço Python não está disponível. Verifique se está executando na porta 3001.');
      }

      if (error.code === 'ETIMEDOUT') {
        throw new Error(`Execução excedeu o tempo limite de ${timeoutSeconds} segundos`);
      }

      throw new Error(`Falha na comunicação com sistema Python: ${error.message}`);
    }
  }

  /**
   * Gera token para autenticação com o microserviço Python
   */
  private getSystemOpsToken(): string {
    // Em produção, usar JWT ou outro método seguro
    return this.configService.get('SYSTEM_OPS_TOKEN', 'netpilot-internal-token');
  }

  /**
   * Método de fallback: execução direta (DEPRECATED)
   * Manter apenas para emergências ou desenvolvimento
   */
  private async executeScriptDirectly(jobData: JobData, job: Job): Promise<JobResult> {
    this.logger.warn('⚠️ EXECUTANDO SCRIPT DIRETAMENTE - MODO DEPRECATED');

    // TODO: Implementação original aqui como fallback
    // Por enquanto, lançar erro para forçar uso do Python
    throw new Error('Execução direta desabilitada. Use o microserviço Python.');
  }

  /**
   * Verificar saúde do microserviço Python
   */
  async checkSystemOpsHealth(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.systemOpsUrl}/health`, { timeout: 5000 })
      );
      return (response.data as any).status === 'healthy';
    } catch (error) {
      this.logger.error(`Sistema Python não está saudável: ${error.message}`);
      return false;
    }
  }

  /**
   * Obter estatísticas do sistema Python
   */
  async getSystemOpsStats() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.systemOpsUrl}/system/info`, {
          timeout: 5000,
          headers: { 'Authorization': `Bearer ${this.getSystemOpsToken()}` }
        })
      );
      return response.data as any;
    } catch (error) {
      this.logger.error(`Erro ao obter estatísticas do sistema Python: ${error.message}`);
      return null;
    }
  }

  // ========================
  // MÉTODOS DE COMPATIBILIDADE
  // ========================

  async getQueueStats() {
    // Para compatibilidade - delegar para Python ou retornar stats básicos
    const health = await this.checkSystemOpsHealth();
    const stats = await this.getSystemOpsStats();

    return {
      healthy: health,
      stats: stats,
      python_integration: true
    };
  }

  async getQueueHealth() {
    return {
      healthy: await this.checkSystemOpsHealth(),
      python_service: true
    };
  }
}