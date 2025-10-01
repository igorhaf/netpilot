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
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
let RedisQueueService = RedisQueueService_1 = class RedisQueueService {
    constructor(jobQueue, jobExecutionRepository, jobQueueRepository, jobQueuesGateway, httpService, configService) {
        this.jobQueue = jobQueue;
        this.jobExecutionRepository = jobExecutionRepository;
        this.jobQueueRepository = jobQueueRepository;
        this.jobQueuesGateway = jobQueuesGateway;
        this.httpService = httpService;
        this.configService = configService;
        this.logger = new common_1.Logger(RedisQueueService_1.name);
        this.systemOpsUrl = this.configService.get('SYSTEM_OPS_URL', 'http://localhost:8001');
    }
    async onModuleInit() {
        this.setupQueueListeners();
        this.logger.log('Redis Queue Service initialized with System Ops integration');
    }
    setupQueueListeners() {
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
    async addJob(jobQueue, executionId, metadata, options) {
        const jobData = {
            jobQueueId: jobQueue.id,
            executionId,
            scriptPath: jobQueue.scriptPath,
            scriptType: jobQueue.scriptType,
            environmentVars: jobQueue.environmentVars || {},
            timeoutSeconds: jobQueue.timeoutSeconds || 300,
            metadata
        };
        const jobOptions = {
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
    async processJob(job) {
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
            const result = await this.executeScriptViaPython(job.data, job);
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
    async executeScriptViaPython(jobData, job) {
        const { scriptPath, scriptType, environmentVars, timeoutSeconds, executionId } = jobData;
        try {
            this.logger.log(`🐍 Delegando execução para Python: ${scriptPath}`);
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
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.systemOpsUrl}/jobs/execute`, requestData, {
                timeout: (timeoutSeconds + 10) * 1000,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getSystemOpsToken()}`
                }
            }));
            const result = response.data;
            job.progress(100);
            this.logger.log(`✅ Script executado via Python com sucesso: ${scriptPath}`);
            return {
                success: result.success || false,
                output: result.output || '',
                error: result.error || undefined,
                executionTimeMs: result.executionTimeMs || 0,
                exitCode: result.exitCode || 0,
            };
        }
        catch (error) {
            this.logger.error(`❌ Erro ao executar script via Python: ${error.message}`);
            if (error.response) {
                const httpError = error.response.data;
                throw new Error(`Sistema Python falhou: ${httpError.detail || httpError.message || error.message}`);
            }
            if (error.code === 'ECONNREFUSED') {
                throw new Error('Microserviço Python não está disponível. Verifique se está executando na porta 3001.');
            }
            if (error.code === 'ETIMEDOUT') {
                throw new Error(`Execução excedeu o tempo limite de ${timeoutSeconds} segundos`);
            }
            throw new Error(`Falha na comunicação com sistema Python: ${error.message}`);
        }
    }
    getSystemOpsToken() {
        return this.configService.get('SYSTEM_OPS_TOKEN', 'netpilot-internal-token');
    }
    async executeScriptDirectly(jobData, job) {
        this.logger.warn('⚠️ EXECUTANDO SCRIPT DIRETAMENTE - MODO DEPRECATED');
        throw new Error('Execução direta desabilitada. Use o microserviço Python.');
    }
    async checkSystemOpsHealth() {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.systemOpsUrl}/health`, { timeout: 5000 }));
            return response.data.status === 'healthy';
        }
        catch (error) {
            this.logger.error(`Sistema Python não está saudável: ${error.message}`);
            return false;
        }
    }
    async getSystemOpsStats() {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.systemOpsUrl}/system/info`, {
                timeout: 5000,
                headers: { 'Authorization': `Bearer ${this.getSystemOpsToken()}` }
            }));
            return response.data;
        }
        catch (error) {
            this.logger.error(`Erro ao obter estatísticas do sistema Python: ${error.message}`);
            return null;
        }
    }
    async getQueueStats() {
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
};
exports.RedisQueueService = RedisQueueService;
__decorate([
    (0, bull_1.Process)('execute-script'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RedisQueueService.prototype, "processJob", null);
exports.RedisQueueService = RedisQueueService = RedisQueueService_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, bull_1.Processor)('job-processor'),
    __param(0, (0, bull_1.InjectQueue)('job-processor')),
    __param(1, (0, typeorm_2.InjectRepository)(job_execution_entity_1.JobExecution)),
    __param(2, (0, typeorm_2.InjectRepository)(job_queue_entity_1.JobQueue)),
    __metadata("design:paramtypes", [Object, typeorm_1.Repository,
        typeorm_1.Repository,
        job_queues_gateway_1.JobQueuesGateway,
        axios_1.HttpService,
        config_1.ConfigService])
], RedisQueueService);
//# sourceMappingURL=redis-queue.service.js.map