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
var RedisQueueService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisQueueService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const job_queue_entity_1 = require("../../entities/job-queue.entity");
const job_execution_entity_1 = require("../../entities/job-execution.entity");
const job_queues_gateway_1 = require("../job-queues/job-queues.gateway");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const child_process_1 = require("child_process");
const path = require("path");
const fs = require("fs");
let RedisQueueService = RedisQueueService_1 = class RedisQueueService {
    constructor(jobQueue, jobExecutionRepository, jobQueueRepository, jobQueuesGateway) {
        this.jobQueue = jobQueue;
        this.jobExecutionRepository = jobExecutionRepository;
        this.jobQueueRepository = jobQueueRepository;
        this.jobQueuesGateway = jobQueuesGateway;
        this.logger = new common_1.Logger(RedisQueueService_1.name);
    }
    async onModuleInit() {
        this.setupQueueListeners();
        this.logger.log('Redis Queue Service initialized');
    }
    setupQueueListeners() {
        this.jobQueue.on('waiting', (jobId) => {
            this.logger.log(`Job ${jobId} adicionado à fila`);
        });
        this.jobQueue.on('active', (job) => {
            this.logger.log(`Job ${job.id} iniciado`);
        });
        this.jobQueue.on('completed', (job, result) => {
            this.logger.log(`Job ${job.id} concluído com sucesso`);
        });
        this.jobQueue.on('failed', (job, err) => {
            this.logger.error(`Job ${job.id} falhou:`, err.message);
        });
        this.jobQueue.on('stalled', (job) => {
            this.logger.warn(`Job ${job.id} travado, será reprocessado`);
        });
        this.jobQueue.on('progress', (job, progress) => {
            this.logger.debug(`Job ${job.id} progresso: ${progress}%`);
        });
    }
    async addJob(jobQueue, executionId, options = {}) {
        const jobData = {
            jobQueueId: jobQueue.id,
            executionId,
            scriptPath: jobQueue.scriptPath,
            scriptType: jobQueue.scriptType,
            environmentVars: jobQueue.environmentVars || {},
            timeoutSeconds: jobQueue.timeoutSeconds || 300,
            metadata: {}
        };
        const jobOptions = {
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
    async handleExecuteScript(job) {
        const { jobQueueId, executionId, scriptPath, scriptType, environmentVars, timeoutSeconds } = job.data;
        const startTime = Date.now();
        try {
            const execution = await this.jobExecutionRepository.findOne({
                where: { id: executionId },
                relations: ['jobQueue']
            });
            if (!execution) {
                throw new Error(`Execução ${executionId} não encontrada`);
            }
            execution.status = job_execution_entity_1.ExecutionStatus.RUNNING;
            execution.startedAt = new Date();
            await this.jobExecutionRepository.save(execution);
            this.jobQueuesGateway.notifyJobStarted(execution, execution.jobQueue);
            const result = await this.executeScript(job.data, job);
            execution.status = job_execution_entity_1.ExecutionStatus.COMPLETED;
            execution.completedAt = new Date();
            execution.executionTimeMs = result.executionTimeMs;
            execution.outputLog = result.output || '';
            execution.errorLog = result.error || '';
            await this.jobExecutionRepository.save(execution);
            this.jobQueuesGateway.notifyJobCompleted(execution, execution.jobQueue);
            return result;
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            const execution = await this.jobExecutionRepository.findOne({
                where: { id: executionId },
                relations: ['jobQueue']
            });
            if (execution) {
                execution.status = job_execution_entity_1.ExecutionStatus.FAILED;
                execution.completedAt = new Date();
                execution.executionTimeMs = executionTime;
                execution.errorLog = error.message;
                await this.jobExecutionRepository.save(execution);
                this.jobQueuesGateway.notifyJobFailed(execution, execution.jobQueue, error.message);
            }
            throw error;
        }
    }
    async executeScript(jobData, job) {
        const { scriptPath, scriptType, environmentVars, timeoutSeconds } = jobData;
        const startTime = Date.now();
        return new Promise((resolve, reject) => {
            let command;
            let args = [];
            let output = '';
            let error = '';
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
            if (!fs.existsSync(scriptPath)) {
                return reject(new Error(`Script não encontrado: ${scriptPath}`));
            }
            const childProcess = (0, child_process_1.spawn)(command, args, {
                env: {
                    ...process.env,
                    ...environmentVars,
                    JOB_ID: job.id.toString(),
                    EXECUTION_ID: jobData.executionId,
                    JOB_QUEUE_ID: jobData.jobQueueId,
                },
                cwd: path.dirname(scriptPath),
            });
            const timeoutId = setTimeout(() => {
                childProcess.kill('SIGTERM');
                reject(new Error('Execução excedeu o tempo limite'));
            }, timeoutSeconds * 1000);
            childProcess.stdout.on('data', (data) => {
                output += data.toString();
                const lines = output.split('\n').length;
                job.progress(Math.min(lines * 2, 90));
            });
            childProcess.stderr.on('data', (data) => {
                error += data.toString();
            });
            childProcess.on('close', (code) => {
                clearTimeout(timeoutId);
                const executionTime = Date.now() - startTime;
                job.progress(100);
                if (code === 0) {
                    resolve({
                        success: true,
                        output,
                        error: error || undefined,
                        executionTimeMs: executionTime,
                        exitCode: code,
                    });
                }
                else {
                    reject(new Error(`Script falhou com código ${code}: ${error}`));
                }
            });
            childProcess.on('error', (err) => {
                clearTimeout(timeoutId);
                reject(err);
            });
        });
    }
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
    async getJob(jobId) {
        return this.jobQueue.getJob(jobId);
    }
    async removeJob(jobId) {
        const job = await this.getJob(jobId);
        if (job) {
            await job.remove();
        }
    }
    async retryJob(jobId) {
        const job = await this.getJob(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} não encontrado`);
        }
        await job.retry();
    }
    async pauseQueue() {
        await this.jobQueue.pause();
        this.logger.log('Fila pausada');
    }
    async resumeQueue() {
        await this.jobQueue.resume();
        this.logger.log('Fila resumida');
    }
    async cleanQueue(grace = 5000) {
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
        }
        catch (error) {
            return {
                healthy: false,
                error: error.message,
                timestamp: new Date(),
            };
        }
    }
};
exports.RedisQueueService = RedisQueueService;
__decorate([
    (0, bull_1.Process)('execute-script'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RedisQueueService.prototype, "handleExecuteScript", null);
exports.RedisQueueService = RedisQueueService = RedisQueueService_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, bull_1.Processor)('job-processor'),
    __param(0, (0, bull_1.InjectQueue)('job-processor')),
    __param(1, (0, typeorm_2.InjectRepository)(job_execution_entity_1.JobExecution)),
    __param(2, (0, typeorm_2.InjectRepository)(job_queue_entity_1.JobQueue)),
    __metadata("design:paramtypes", [Object, typeorm_1.Repository,
        typeorm_1.Repository,
        job_queues_gateway_1.JobQueuesGateway])
], RedisQueueService);
//# sourceMappingURL=redis-queue.service.ORIGINAL.js.map