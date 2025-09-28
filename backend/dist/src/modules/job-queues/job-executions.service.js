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
            metadata: executeJobDto.metadata,
        });
        const savedExecution = await this.jobExecutionRepository.save(execution);
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
                    command = 'bash';
                    args = [jobQueue.scriptPath];
                    break;
                case job_queue_entity_1.ScriptType.NODE:
                    command = 'node';
                    args = [jobQueue.scriptPath];
                    break;
                case job_queue_entity_1.ScriptType.PYTHON:
                    command = 'python3';
                    args = [jobQueue.scriptPath];
                    break;
                case job_queue_entity_1.ScriptType.INTERNAL:
                    return this.executeInternalScript(context)
                        .then(resolve)
                        .catch(reject);
                default:
                    return reject(new Error(`Tipo de script não suportado: ${jobQueue.scriptType}`));
            }
            if (!fs.existsSync(jobQueue.scriptPath)) {
                return reject(new Error(`Script não encontrado: ${jobQueue.scriptPath}`));
            }
            const startTime = Date.now();
            const childProcess = (0, child_process_1.spawn)(command, args, {
                env: {
                    ...process.env,
                    ...environmentVars,
                    JOB_ID: execution.id,
                    JOB_NAME: jobQueue.name,
                },
                cwd: path.dirname(jobQueue.scriptPath),
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
            const scriptModule = await Promise.resolve(`${path.resolve(jobQueue.scriptPath)}`).then(s => require(s));
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
            query.andWhere('execution.status = :status', { status: filters.status });
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