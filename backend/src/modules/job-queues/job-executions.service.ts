import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobExecution, ExecutionStatus, TriggerType } from '../../entities/job-execution.entity';
import { JobQueue, ScriptType } from '../../entities/job-queue.entity';
import { JobExecutionQueryDto } from './dto/job-execution-query.dto';
import { ExecuteJobDto } from './dto/execute-job.dto';
import { JobExecutionResult, ScriptExecutionContext } from './types/job-queue.types';
import { JobQueuesGateway } from './job-queues.gateway';
import { RedisQueueService } from '../redis/redis-queue.service';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class JobExecutionsService {
  private runningProcesses = new Map<string, ChildProcess>();

  constructor(
    @InjectRepository(JobExecution)
    private jobExecutionRepository: Repository<JobExecution>,
    @InjectRepository(JobQueue)
    private jobQueueRepository: Repository<JobQueue>,
    private jobQueuesGateway: JobQueuesGateway,
    private redisQueueService: RedisQueueService,
  ) {}

  async executeJob(
    jobQueueId: string,
    executeJobDto: ExecuteJobDto,
    userId?: string
  ): Promise<JobExecution> {
    const jobQueue = await this.jobQueueRepository.findOne({
      where: { id: jobQueueId },
    });

    if (!jobQueue) {
      throw new NotFoundException('Job não encontrado');
    }

    if (!jobQueue.isActive) {
      throw new BadRequestException('Job está desativado');
    }

    // Criar registro de execução
    const execution = this.jobExecutionRepository.create({
      jobQueue,
      status: ExecutionStatus.PENDING,
      triggerType: executeJobDto.triggerType || TriggerType.MANUAL,
      triggeredBy: userId ? { id: userId } as any : null,
      // Usar metadata do executeJobDto se fornecido, senão copiar do jobQueue
      metadata: executeJobDto.metadata || jobQueue.metadata || null,
    });

    const savedExecution = await this.jobExecutionRepository.save(execution);

    // Verificar se deve usar execução local:
    // - Scripts INTERNAL devem SEMPRE ser executados localmente (não via Redis/Python)
    // - Scripts SHELL que são comandos diretos (não arquivos) também executam localmente
    const shouldUseLocalExecution =
      jobQueue.scriptType === ScriptType.INTERNAL ||
      (jobQueue.scriptType === ScriptType.SHELL && !fs.existsSync(jobQueue.scriptPath));

    if (shouldUseLocalExecution) {
      // Usar execução local para comandos shell diretos
      console.log('Usando execução local para comando shell direto:', jobQueue.scriptPath);
      this.performExecution(savedExecution, jobQueue, executeJobDto.environmentVars)
        .catch(error => {
          console.error('Erro na execução local do job:', error);
        });
    } else {
      // Adicionar job à fila Redis para scripts de arquivo
      try {
        await this.redisQueueService.addJob(jobQueue, savedExecution.id, {
          delay: executeJobDto.delay || 0,
          priority: executeJobDto.priority || 0,
        });
      } catch (error) {
        // Se falhar ao adicionar no Redis, usar execução local como fallback
        console.warn('Fallback para execução local devido a erro no Redis:', error.message);
        this.performExecution(savedExecution, jobQueue, executeJobDto.environmentVars)
          .catch(error => {
            console.error('Erro na execução local do job:', error);
          });
      }
    }

    return savedExecution;
  }

  async getRedisStats() {
    try {
      return await this.redisQueueService.getQueueStats();
    } catch (error) {
      console.warn('Erro ao obter estatísticas do Redis:', error.message);
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        paused: false,
        total: 0,
        error: 'Redis não disponível'
      };
    }
  }

  async getRedisHealth() {
    try {
      return await this.redisQueueService.getQueueHealth();
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  private async performExecution(
    execution: JobExecution,
    jobQueue: JobQueue,
    additionalEnvVars?: Record<string, string>
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Atualizar status para running
      execution.status = ExecutionStatus.RUNNING;
      execution.startedAt = new Date();
      await this.jobExecutionRepository.save(execution);

      // Notificar início da execução
      this.jobQueuesGateway.notifyJobStarted(execution, jobQueue);

      // Preparar contexto de execução
      const context: ScriptExecutionContext = {
        jobQueue,
        execution,
        environmentVars: {
          ...jobQueue.environmentVars,
          ...additionalEnvVars,
        },
        metadata: execution.metadata,
        timeout: jobQueue.timeoutSeconds * 1000,
      };

      // Executar script baseado no tipo
      const result = await this.executeScript(context);

      // Atualizar execução com sucesso
      execution.status = ExecutionStatus.COMPLETED;
      execution.completedAt = new Date();
      execution.executionTimeMs = Date.now() - startTime;
      execution.outputLog = result.output || '';
      execution.errorLog = result.error || '';

      // Notificar conclusão com sucesso
      this.jobQueuesGateway.notifyJobCompleted(execution, jobQueue);

    } catch (error) {
      // Atualizar execução com erro
      execution.status = ExecutionStatus.FAILED;
      execution.completedAt = new Date();
      execution.executionTimeMs = Date.now() - startTime;
      execution.errorLog = error.message || error.toString();

      // Notificar falha
      this.jobQueuesGateway.notifyJobFailed(execution, jobQueue, error.message);

      // Verificar se deve tentar novamente
      if (execution.retryCount < jobQueue.maxRetries) {
        execution.retryCount++;
        execution.status = ExecutionStatus.PENDING;
        execution.completedAt = null;

        // Notificar retry
        this.jobQueuesGateway.notifyJobRetry(execution, jobQueue);

        // Reagendar execução após delay
        setTimeout(() => {
          this.performExecution(execution, jobQueue, additionalEnvVars);
        }, Math.pow(2, execution.retryCount) * 1000); // Backoff exponencial
      }
    } finally {
      await this.jobExecutionRepository.save(execution);
      this.runningProcesses.delete(execution.id);
    }
  }

  private async executeScript(context: ScriptExecutionContext): Promise<JobExecutionResult> {
    const { jobQueue, execution, environmentVars, timeout } = context;

    return new Promise((resolve, reject) => {
      let command: string;
      let args: string[] = [];
      let output = '';
      let error = '';

      // Determinar comando baseado no tipo de script
      switch (jobQueue.scriptType) {
        case ScriptType.SHELL:
          // Se o scriptPath não é um arquivo existente, trata como comando direto
          if (fs.existsSync(jobQueue.scriptPath)) {
            command = '/bin/sh';
            args = [jobQueue.scriptPath];
          } else {
            // Executar comando direto via sh -c
            command = '/bin/sh';
            args = ['-c', jobQueue.scriptPath];
          }
          break;

        case ScriptType.NODE:
          command = 'node';
          args = [jobQueue.scriptPath];
          // Verificar se arquivo existe para Node
          if (!fs.existsSync(jobQueue.scriptPath)) {
            return reject(new Error(`Script não encontrado: ${jobQueue.scriptPath}`));
          }
          break;

        case ScriptType.PYTHON:
          command = 'python3';
          args = [jobQueue.scriptPath];
          // Verificar se arquivo existe para Python
          if (!fs.existsSync(jobQueue.scriptPath)) {
            return reject(new Error(`Script não encontrado: ${jobQueue.scriptPath}`));
          }
          break;

        case ScriptType.INTERNAL:
          // Executar função interna
          return this.executeInternalScript(context)
            .then(resolve)
            .catch(reject);

        default:
          return reject(new Error(`Tipo de script não suportado: ${jobQueue.scriptType}`));
      }

      const startTime = Date.now();

      // Executar processo
      const childProcess = spawn(command, args, {
        env: {
          ...process.env,
          ...environmentVars,
          JOB_ID: execution.id,
          JOB_NAME: jobQueue.name,
          PATH: process.env.PATH || '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
        },
        cwd: jobQueue.scriptType === ScriptType.SHELL && !fs.existsSync(jobQueue.scriptPath)
          ? process.cwd()
          : (fs.existsSync(path.dirname(jobQueue.scriptPath)) ? path.dirname(jobQueue.scriptPath) : process.cwd()),
        shell: false,
      });

      // Armazenar processo para possível cancelamento
      this.runningProcesses.set(execution.id, childProcess);

      // Configurar timeout
      const timeoutId = setTimeout(() => {
        childProcess.kill('SIGTERM');
        reject(new Error('Execução excedeu o tempo limite'));
      }, timeout);

      // Capturar output
      childProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      childProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      // Finalização do processo
      childProcess.on('close', (code) => {
        clearTimeout(timeoutId);
        this.runningProcesses.delete(execution.id);

        const executionTime = Date.now() - startTime;

        if (code === 0) {
          resolve({
            success: true,
            output,
            error: error || undefined,
            executionTimeMs: executionTime,
          });
        } else {
          reject(new Error(`Script falhou com código ${code}: ${error}`));
        }
      });

      childProcess.on('error', (err) => {
        clearTimeout(timeoutId);
        this.runningProcesses.delete(execution.id);
        reject(err);
      });
    });
  }

  private async executeInternalScript(context: ScriptExecutionContext): Promise<JobExecutionResult> {
    const { jobQueue } = context;
    const startTime = Date.now();

    try {
      // Mapear nomes de scripts para caminhos
      const scriptMap: Record<string, string> = {
        'ai-prompt-handler': path.join(__dirname, 'scripts', 'ai-prompt-handler.script'),
        'ai-analysis': path.join(__dirname, 'scripts', 'ai-analysis.script'),
        'backup': path.join(__dirname, 'scripts', 'backup.script'),
        'log-cleanup': path.join(__dirname, 'scripts', 'log-cleanup.script'),
        'ssl-check': path.join(__dirname, 'scripts', 'ssl-check.script'),
      };

      // Resolver caminho do script
      let scriptPath = scriptMap[jobQueue.scriptPath] || jobQueue.scriptPath;

      // Se não for um caminho absoluto, resolver relativo ao diretório atual
      if (!path.isAbsolute(scriptPath)) {
        scriptPath = path.resolve(scriptPath);
      }

      // Carregar e executar script interno
      const scriptModule = await import(scriptPath);
      let result;

      if (typeof scriptModule.default === 'function') {
        result = await scriptModule.default(context);
      } else if (typeof scriptModule.execute === 'function') {
        result = await scriptModule.execute(context);
      } else {
        throw new Error('Script interno deve exportar uma função execute ou default');
      }

      return {
        success: true,
        output: result?.output || 'Execução concluída com sucesso',
        executionTimeMs: Date.now() - startTime,
        metadata: result?.metadata,
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  async findAll(queryDto: JobExecutionQueryDto): Promise<{
    data: JobExecution[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 10, ...filters } = queryDto;
    const skip = (page - 1) * limit;

    const query = this.jobExecutionRepository.createQueryBuilder('execution')
      .leftJoinAndSelect('execution.jobQueue', 'jobQueue')
      .leftJoinAndSelect('execution.triggeredBy', 'triggeredBy');

    // Aplicar filtros
    if (filters.jobQueueId) {
      query.andWhere('execution.jobQueue.id = :jobQueueId', { jobQueueId: filters.jobQueueId });
    }

    if (filters.status) {
      // Suportar múltiplos status separados por vírgula ou array
      const statusArray = Array.isArray(filters.status)
        ? filters.status
        : filters.status.includes(',')
          ? filters.status.split(',').map(s => s.trim())
          : [filters.status];

      if (statusArray.length === 1) {
        query.andWhere('execution.status = :status', { status: statusArray[0] });
      } else {
        query.andWhere('execution.status IN (:...statuses)', { statuses: statusArray });
      }
    }

    if (filters.triggerType) {
      query.andWhere('execution.triggerType = :triggerType', { triggerType: filters.triggerType });
    }

    if (filters.startDate) {
      query.andWhere('execution.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query.andWhere('execution.createdAt <= :endDate', { endDate: filters.endDate });
    }

    if (filters.search) {
      query.andWhere('jobQueue.name ILIKE :search', { search: `%${filters.search}%` });
    }

    if (filters.projectId) {
      query.andWhere("execution.metadata->>'projectId' = :projectId", { projectId: filters.projectId });
    }

    // Contar total
    const total = await query.getCount();

    // Obter dados paginados
    const data = await query
      .orderBy('execution.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<JobExecution> {
    const execution = await this.jobExecutionRepository.findOne({
      where: { id },
      relations: ['jobQueue', 'triggeredBy'],
    });

    if (!execution) {
      throw new NotFoundException('Execução não encontrada');
    }

    return execution;
  }

  async cancel(id: string): Promise<JobExecution> {
    const execution = await this.findOne(id);

    if (execution.status !== ExecutionStatus.RUNNING && execution.status !== ExecutionStatus.PENDING) {
      throw new BadRequestException('Execução não pode ser cancelada neste estado');
    }

    // Cancelar processo se estiver rodando
    const process = this.runningProcesses.get(id);
    if (process) {
      process.kill('SIGTERM');
      this.runningProcesses.delete(id);
    }

    execution.status = ExecutionStatus.CANCELLED;
    execution.completedAt = new Date();

    const savedExecution = await this.jobExecutionRepository.save(execution);

    // Notificar cancelamento
    this.jobQueuesGateway.notifyJobCancelled(savedExecution, execution.jobQueue);

    return savedExecution;
  }

  async retry(id: string): Promise<JobExecution> {
    const execution = await this.findOne(id);

    if (execution.status !== ExecutionStatus.FAILED) {
      throw new BadRequestException('Apenas execuções falhadas podem ser reexecutadas');
    }

    // Criar nova execução baseada na anterior
    const newExecution = this.jobExecutionRepository.create({
      jobQueue: execution.jobQueue,
      status: ExecutionStatus.PENDING,
      triggerType: TriggerType.MANUAL,
      triggeredBy: execution.triggeredBy,
      metadata: execution.metadata,
    });

    const savedExecution = await this.jobExecutionRepository.save(newExecution);

    // Executar em background
    this.performExecution(savedExecution, execution.jobQueue)
      .catch(error => {
        console.error('Erro na reexecução do job:', error);
      });

    return savedExecution;
  }

  async getRetryStats(jobQueueId?: string, timeRange: '24h' | '7d' | '30d' = '24h'): Promise<any> {
    // Calcular data de início baseado no timeRange
    const now = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
    }

    // Query base
    let queryBuilder = this.jobExecutionRepository.createQueryBuilder('execution');

    if (jobQueueId) {
      queryBuilder = queryBuilder.where('execution.jobQueue.id = :jobQueueId', { jobQueueId });
    }

    queryBuilder = queryBuilder.andWhere('execution.createdAt >= :startDate', { startDate });

    // Total de execuções
    const totalExecutions = await queryBuilder.getCount();

    // Execuções falhadas
    const failedExecutions = await queryBuilder
      .clone()
      .andWhere('execution.status = :status', { status: ExecutionStatus.FAILED })
      .getCount();

    // Execuções com retry (retryCount > 0)
    const retriedExecutions = await queryBuilder
      .clone()
      .andWhere('execution.retryCount > 0')
      .getCount();

    // Sucesso após retry
    const successAfterRetry = await queryBuilder
      .clone()
      .andWhere('execution.retryCount > 0')
      .andWhere('execution.status = :status', { status: ExecutionStatus.COMPLETED })
      .getCount();

    // Máximo de retries
    const maxRetryResult = await queryBuilder
      .clone()
      .select('MAX(execution.retryCount)', 'max')
      .getRawOne();
    const maxRetryCount = Number(maxRetryResult?.max) || 0;

    // Média de retries
    const avgRetryResult = await queryBuilder
      .clone()
      .select('AVG(execution.retryCount)', 'avg')
      .where('execution.retryCount > 0')
      .getRawOne();
    const avgRetryCount = Number(avgRetryResult?.avg) || 0;

    // Taxa de sucesso após retry
    const retrySuccessRate = retriedExecutions > 0
      ? Math.round((successAfterRetry / retriedExecutions) * 100)
      : 0;

    // Códigos de erro mais comuns (usando errorLog)
    const errorLogs = await queryBuilder
      .clone()
      .select('execution.errorLog')
      .where('execution.status = :status', { status: ExecutionStatus.FAILED })
      .andWhere('execution.errorLog IS NOT NULL')
      .andWhere('execution.errorLog != \'\'')
      .limit(100)
      .getMany();

    // Extrair códigos de erro (procurar por padrões como "exit code 1", "code: 127", etc)
    const errorCodes = new Map<number, number>();
    errorLogs.forEach(execution => {
      const errorLog = execution.errorLog || '';
      // Procurar padrões de código de erro
      const codeMatch = errorLog.match(/(?:exit code|code:|error code)\s*:?\s*(\d+)/i);
      if (codeMatch) {
        const code = Number(codeMatch[1]);
        errorCodes.set(code, (errorCodes.get(code) || 0) + 1);
      }
    });

    // Converter para array e ordenar por contagem
    const commonFailureCodes = Array.from(errorCodes.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    // Tendência de retries (últimos 5 dias)
    const retryTrends = [];
    for (let i = 4; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayRetries = await this.jobExecutionRepository
        .createQueryBuilder('execution')
        .where('execution.createdAt >= :startDate', { startDate: date })
        .andWhere('execution.createdAt < :endDate', { endDate: nextDate })
        .andWhere('execution.retryCount > 0')
        .getCount();

      const daySuccess = await this.jobExecutionRepository
        .createQueryBuilder('execution')
        .where('execution.createdAt >= :startDate', { startDate: date })
        .andWhere('execution.createdAt < :endDate', { endDate: nextDate })
        .andWhere('execution.retryCount > 0')
        .andWhere('execution.status = :status', { status: ExecutionStatus.COMPLETED })
        .getCount();

      retryTrends.push({
        date: date.toISOString().split('T')[0],
        retries: dayRetries,
        success: daySuccess,
      });
    }

    return {
      totalExecutions,
      failedExecutions,
      retriedExecutions,
      successAfterRetry,
      maxRetryCount,
      avgRetryCount: Math.round(avgRetryCount * 10) / 10,
      retrySuccessRate,
      commonFailureCodes,
      retryTrends,
    };
  }

  async delete(id: string): Promise<void> {
    const execution = await this.jobExecutionRepository.findOne({ where: { id } });

    if (!execution) {
      throw new NotFoundException('Execução não encontrada');
    }

    await this.jobExecutionRepository.remove(execution);
  }
}