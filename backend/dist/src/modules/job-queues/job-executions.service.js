"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobExecutionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const job_execution_entity_1 = require("../../entities/job-execution.entity");
const job_queue_entity_1 = require("../../entities/job-queue.entity");
const job_queues_gateway_1 = require("./job-queues.gateway");
const redis_queue_service_1 = require("../redis/redis-queue.service");
const child_process_1 = require("child_process");
const path = require("path");
const fs = require("fs");
let JobExecutionsService = class JobExecutionsService {
    constructor(jobExecutionRepository, jobQueueRepository, jobQueuesGateway, redisQueueService) {
        this.jobExecutionRepository = jobExecutionRepository;
        this.jobQueueRepository = jobQueueRepository;
        this.jobQueuesGateway = jobQueuesGateway;
        this.redisQueueService = redisQueueService;
        this.runningProcesses = new Map();
    }
    async executeJob(jobQueueId, executeJobDto, userId) {
        const jobQueue = await this.jobQueueRepository.findOne({
            where: { id: jobQueueId },
        });
        if (!jobQueue) {
            throw new common_1.NotFoundException('Job não encontrado');
        }
        if (!jobQueue.isActive) {
            throw new common_1.BadRequestException('Job está desativado');
        }
        const execution = this.jobExecutionRepository.create({
            jobQueue,
            status: job_execution_entity_1.ExecutionStatus.PENDING,
            triggerType: executeJobDto.triggerType || job_execution_entity_1.TriggerType.MANUAL,
            triggeredBy: userId ? { id: userId } : null,
            metadata: executeJobDto.metadata || jobQueue.metadata || null,
        });
        const savedExecution = await this.jobExecutionRepository.save(execution);
        const shouldUseLocalExecution = jobQueue.scriptType === job_queue_entity_1.ScriptType.INTERNAL ||
            (jobQueue.scriptType === job_queue_entity_1.ScriptType.SHELL && !fs.existsSync(jobQueue.scriptPath));
        if (shouldUseLocalExecution) {
            console.log('Usando execução local para comando shell direto:', jobQueue.scriptPath);
            this.performExecution(savedExecution, jobQueue, executeJobDto.environmentVars)
                .catch(error => {
                console.error('Erro na execução local do job:', error);
            });
        }
        else {
            try {
                await this.redisQueueService.addJob(jobQueue, savedExecution.id, {
                    delay: executeJobDto.delay || 0,
                    priority: executeJobDto.priority || 0,
                });
            }
            catch (error) {
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
        }
        catch (error) {
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
        }
        catch (error) {
            return {
                healthy: false,
                error: error.message,
                timestamp: new Date(),
            };
        }
    }
    async performExecution(execution, jobQueue, additionalEnvVars) {
        const startTime = Date.now();
        try {
            execution.status = job_execution_entity_1.ExecutionStatus.RUNNING;
            execution.startedAt = new Date();
            await this.jobExecutionRepository.save(execution);
            this.jobQueuesGateway.notifyJobStarted(execution, jobQueue);
            const context = {
                jobQueue,
                execution,
                environmentVars: {
                    ...jobQueue.environmentVars,
                    ...additionalEnvVars,
                },
                metadata: execution.metadata,
                timeout: jobQueue.timeoutSeconds * 1000,
            };
            const result = await this.executeScript(context);
            execution.status = job_execution_entity_1.ExecutionStatus.COMPLETED;
            execution.completedAt = new Date();
            execution.executionTimeMs = Date.now() - startTime;
            execution.outputLog = result.output || '';
            execution.errorLog = result.error || '';
            this.jobQueuesGateway.notifyJobCompleted(execution, jobQueue);
        }
        catch (error) {
            execution.status = job_execution_entity_1.ExecutionStatus.FAILED;
            execution.completedAt = new Date();
            execution.executionTimeMs = Date.now() - startTime;
            execution.errorLog = error.message || error.toString();
            this.jobQueuesGateway.notifyJobFailed(execution, jobQueue, error.message);
            if (execution.retryCount < jobQueue.maxRetries) {
                execution.retryCount++;
                execution.status = job_execution_entity_1.ExecutionStatus.PENDING;
                execution.completedAt = null;
                this.jobQueuesGateway.notifyJobRetry(execution, jobQueue);
                setTimeout(() => {
                    this.performExecution(execution, jobQueue, additionalEnvVars);
                }, Math.pow(2, execution.retryCount) * 1000);
            }
        }
        finally {
            await this.jobExecutionRepository.save(execution);
            this.runningProcesses.delete(execution.id);
        }
    }
    async executeScript(context) {
        const { jobQueue, execution, environmentVars, timeout } = context;
        return new Promise((resolve, reject) => {
            let command;
            let args = [];
            let output = '';
            let error = '';
            switch (jobQueue.scriptType) {
                case job_queue_entity_1.ScriptType.SHELL:
                    if (fs.existsSync(jobQueue.scriptPath)) {
                        command = '/bin/sh';
                        args = [jobQueue.scriptPath];
                    }
                    else {
                        command = '/bin/sh';
                        args = ['-c', jobQueue.scriptPath];
                    }
                    break;
                case job_queue_entity_1.ScriptType.NODE:
                    command = 'node';
                    args = [jobQueue.scriptPath];
                    if (!fs.existsSync(jobQueue.scriptPath)) {
                        return reject(new Error(`Script não encontrado: ${jobQueue.scriptPath}`));
                    }
                    break;
                case job_queue_entity_1.ScriptType.PYTHON:
                    command = 'python3';
                    args = [jobQueue.scriptPath];
                    if (!fs.existsSync(jobQueue.scriptPath)) {
                        return reject(new Error(`Script não encontrado: ${jobQueue.scriptPath}`));
                    }
                    break;
                case job_queue_entity_1.ScriptType.INTERNAL:
                    return this.executeInternalScript(context)
                        .then(resolve)
                        .catch(reject);
                default:
                    return reject(new Error(`Tipo de script não suportado: ${jobQueue.scriptType}`));
            }
            const startTime = Date.now();
            const childProcess = (0, child_process_1.spawn)(command, args, {
                env: {
                    ...process.env,
                    ...environmentVars,
                    JOB_ID: execution.id,
                    JOB_NAME: jobQueue.name,
                    PATH: process.env.PATH || '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
                },
                cwd: jobQueue.scriptType === job_queue_entity_1.ScriptType.SHELL && !fs.existsSync(jobQueue.scriptPath)
                    ? process.cwd()
                    : (fs.existsSync(path.dirname(jobQueue.scriptPath)) ? path.dirname(jobQueue.scriptPath) : process.cwd()),
                shell: false,
            });
            this.runningProcesses.set(execution.id, childProcess);
            const timeoutId = setTimeout(() => {
                childProcess.kill('SIGTERM');
                reject(new Error('Execução excedeu o tempo limite'));
            }, timeout);
            childProcess.stdout.on('data', (data) => {
                output += data.toString();
            });
            childProcess.stderr.on('data', (data) => {
                error += data.toString();
            });
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
                }
                else {
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
    async executeInternalScript(context) {
        const { jobQueue } = context;
        const startTime = Date.now();
        try {
            const scriptMap = {
                'ai-prompt-handler': path.join(__dirname, 'scripts', 'ai-prompt-handler.script'),
                'ai-analysis': path.join(__dirname, 'scripts', 'ai-analysis.script'),
                'backup': path.join(__dirname, 'scripts', 'backup.script'),
                'log-cleanup': path.join(__dirname, 'scripts', 'log-cleanup.script'),
                'ssl-check': path.join(__dirname, 'scripts', 'ssl-check.script'),
            };
            let scriptPath = scriptMap[jobQueue.scriptPath] || jobQueue.scriptPath;
            if (!path.isAbsolute(scriptPath)) {
                scriptPath = path.resolve(scriptPath);
            }
            const scriptModule = await Promise.resolve(`${scriptPath}`).then(s => require(s));
            let result;
            if (typeof scriptModule.default === 'function') {
                result = await scriptModule.default(context);
            }
            else if (typeof scriptModule.execute === 'function') {
                result = await scriptModule.execute(context);
            }
            else {
                throw new Error('Script interno deve exportar uma função execute ou default');
            }
            return {
                success: true,
                output: result?.output || 'Execução concluída com sucesso',
                executionTimeMs: Date.now() - startTime,
                metadata: result?.metadata,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                executionTimeMs: Date.now() - startTime,
            };
        }
    }
    async findAll(queryDto) {
        const { page = 1, limit = 10, ...filters } = queryDto;
        const skip = (page - 1) * limit;
        const query = this.jobExecutionRepository.createQueryBuilder('execution')
            .leftJoinAndSelect('execution.jobQueue', 'jobQueue')
            .leftJoinAndSelect('execution.triggeredBy', 'triggeredBy');
        if (filters.jobQueueId) {
            query.andWhere('execution.jobQueue.id = :jobQueueId', { jobQueueId: filters.jobQueueId });
        }
        if (filters.status) {
            const statusArray = Array.isArray(filters.status)
                ? filters.status
                : filters.status.includes(',')
                    ? filters.status.split(',').map(s => s.trim())
                    : [filters.status];
            if (statusArray.length === 1) {
                query.andWhere('execution.status = :status', { status: statusArray[0] });
            }
            else {
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
        const total = await query.getCount();
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
    async findOne(id) {
        const execution = await this.jobExecutionRepository.findOne({
            where: { id },
            relations: ['jobQueue', 'triggeredBy'],
        });
        if (!execution) {
            throw new common_1.NotFoundException('Execução não encontrada');
        }
        return execution;
    }
    async cancel(id) {
        const execution = await this.findOne(id);
        if (execution.status !== job_execution_entity_1.ExecutionStatus.RUNNING && execution.status !== job_execution_entity_1.ExecutionStatus.PENDING) {
            throw new common_1.BadRequestException('Execução não pode ser cancelada neste estado');
        }
        const process = this.runningProcesses.get(id);
        if (process) {
            process.kill('SIGTERM');
            this.runningProcesses.delete(id);
        }
        execution.status = job_execution_entity_1.ExecutionStatus.CANCELLED;
        execution.completedAt = new Date();
        const savedExecution = await this.jobExecutionRepository.save(execution);
        this.jobQueuesGateway.notifyJobCancelled(savedExecution, execution.jobQueue);
        return savedExecution;
    }
    async retry(id) {
        const execution = await this.findOne(id);
        if (execution.status !== job_execution_entity_1.ExecutionStatus.FAILED) {
            throw new common_1.BadRequestException('Apenas execuções falhadas podem ser reexecutadas');
        }
        const newExecution = this.jobExecutionRepository.create({
            jobQueue: execution.jobQueue,
            status: job_execution_entity_1.ExecutionStatus.PENDING,
            triggerType: job_execution_entity_1.TriggerType.MANUAL,
            triggeredBy: execution.triggeredBy,
            metadata: execution.metadata,
        });
        const savedExecution = await this.jobExecutionRepository.save(newExecution);
        this.performExecution(savedExecution, execution.jobQueue)
            .catch(error => {
            console.error('Erro na reexecução do job:', error);
        });
        return savedExecution;
    }
    async getRetryStats(jobQueueId, timeRange = '24h') {
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
        let queryBuilder = this.jobExecutionRepository.createQueryBuilder('execution');
        if (jobQueueId) {
            queryBuilder = queryBuilder.where('execution.jobQueue.id = :jobQueueId', { jobQueueId });
        }
        queryBuilder = queryBuilder.andWhere('execution.createdAt >= :startDate', { startDate });
        const totalExecutions = await queryBuilder.getCount();
        const failedExecutions = await queryBuilder
            .clone()
            .andWhere('execution.status = :status', { status: job_execution_entity_1.ExecutionStatus.FAILED })
            .getCount();
        const retriedExecutions = await queryBuilder
            .clone()
            .andWhere('execution.retryCount > 0')
            .getCount();
        const successAfterRetry = await queryBuilder
            .clone()
            .andWhere('execution.retryCount > 0')
            .andWhere('execution.status = :status', { status: job_execution_entity_1.ExecutionStatus.COMPLETED })
            .getCount();
        const maxRetryResult = await queryBuilder
            .clone()
            .select('MAX(execution.retryCount)', 'max')
            .getRawOne();
        const maxRetryCount = Number(maxRetryResult?.max) || 0;
        const avgRetryResult = await queryBuilder
            .clone()
            .select('AVG(execution.retryCount)', 'avg')
            .where('execution.retryCount > 0')
            .getRawOne();
        const avgRetryCount = Number(avgRetryResult?.avg) || 0;
        const retrySuccessRate = retriedExecutions > 0
            ? Math.round((successAfterRetry / retriedExecutions) * 100)
            : 0;
        const errorLogs = await queryBuilder
            .clone()
            .select('execution.errorLog')
            .where('execution.status = :status', { status: job_execution_entity_1.ExecutionStatus.FAILED })
            .andWhere('execution.errorLog IS NOT NULL')
            .andWhere('execution.errorLog != \'\'')
            .limit(100)
            .getMany();
        const errorCodes = new Map();
        errorLogs.forEach(execution => {
            const errorLog = execution.errorLog || '';
            const codeMatch = errorLog.match(/(?:exit code|code:|error code)\s*:?\s*(\d+)/i);
            if (codeMatch) {
                const code = Number(codeMatch[1]);
                errorCodes.set(code, (errorCodes.get(code) || 0) + 1);
            }
        });
        const commonFailureCodes = Array.from(errorCodes.entries())
            .map(([code, count]) => ({ code, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 4);
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
                .andWhere('execution.status = :status', { status: job_execution_entity_1.ExecutionStatus.COMPLETED })
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
    async delete(id) {
        const execution = await this.jobExecutionRepository.findOne({ where: { id } });
        if (!execution) {
            throw new common_1.NotFoundException('Execução não encontrada');
        }
        await this.jobExecutionRepository.remove(execution);
    }
};
exports.JobExecutionsService = JobExecutionsService;
exports.JobExecutionsService = JobExecutionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(job_execution_entity_1.JobExecution)),
    __param(1, (0, typeorm_1.InjectRepository)(job_queue_entity_1.JobQueue)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        job_queues_gateway_1.JobQueuesGateway,
        redis_queue_service_1.RedisQueueService])
], JobExecutionsService);
//# sourceMappingURL=job-executions.service.js.map