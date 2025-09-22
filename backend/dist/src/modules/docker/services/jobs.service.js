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
var JobsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bull_1 = require("@nestjs/bull");
const docker_job_entity_1 = require("../entities/docker-job.entity");
let JobsService = JobsService_1 = class JobsService {
    constructor(jobsRepo, dockerQueue) {
        this.jobsRepo = jobsRepo;
        this.dockerQueue = dockerQueue;
        this.logger = new common_1.Logger(JobsService_1.name);
    }
    async createJob(type, resourceType, resourceId, parameters, user) {
        const job = this.jobsRepo.create({
            type,
            resource_type: resourceType,
            resource_id: resourceId,
            parameters,
            user,
            status: 'pending',
            progress: 0
        });
        const savedJob = await this.jobsRepo.save(job);
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
    async getJob(jobId) {
        const job = await this.jobsRepo.findOne({
            where: { id: jobId },
            relations: ['user']
        });
        if (!job) {
            throw new Error('Job not found');
        }
        return job;
    }
    async getJobs(filters) {
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
    async updateJobProgress(jobId, progress, message) {
        const updateData = {
            progress,
            status: progress === 100 ? 'completed' : 'running'
        };
        if (message) {
            updateData.message = message;
        }
        if (progress === 100) {
            updateData.completed_at = new Date();
        }
        await this.jobsRepo.update(jobId, updateData);
    }
    async completeJob(jobId, result) {
        await this.jobsRepo.update(jobId, {
            status: 'completed',
            progress: 100,
            result,
            completed_at: new Date()
        });
    }
    async failJob(jobId, error) {
        await this.jobsRepo.update(jobId, {
            status: 'failed',
            error,
            completed_at: new Date()
        });
    }
    async processVolumeBackup(job) {
        const { jobId, resourceId, parameters } = job.data;
        try {
            await this.updateJobProgress(jobId, 10, 'Iniciando backup do volume...');
            await this.simulateBackup(jobId);
            await this.completeJob(jobId, {
                backup_file: `/backups/${resourceId}_${Date.now()}.tar.gz`,
                backup_size: 1024 * 1024 * 100,
                backup_hash: 'sha256:abcdef123456'
            });
        }
        catch (error) {
            this.logger.error(`Backup job ${jobId} failed`, error);
            await this.failJob(jobId, error.message);
        }
    }
    async processVolumeRestore(job) {
        const { jobId, resourceId, parameters } = job.data;
        try {
            await this.updateJobProgress(jobId, 10, 'Iniciando restore do volume...');
            await this.simulateRestore(jobId);
            await this.completeJob(jobId, {
                restored_volume: resourceId,
                restored_from: parameters.backup_id
            });
        }
        catch (error) {
            this.logger.error(`Restore job ${jobId} failed`, error);
            await this.failJob(jobId, error.message);
        }
    }
    async processImagePull(job) {
        const { jobId, resourceId, parameters } = job.data;
        try {
            await this.updateJobProgress(jobId, 5, `Fazendo pull da imagem ${resourceId}...`);
            await this.simulatePull(jobId);
            await this.completeJob(jobId, {
                image: resourceId,
                pulled_at: new Date()
            });
        }
        catch (error) {
            this.logger.error(`Pull job ${jobId} failed`, error);
            await this.failJob(jobId, error.message);
        }
    }
    async processPrune(job) {
        const { jobId, resourceType, parameters } = job.data;
        try {
            await this.updateJobProgress(jobId, 10, `Iniciando limpeza de ${resourceType}...`);
            await this.simulatePrune(jobId);
            await this.completeJob(jobId, {
                resource_type: resourceType,
                items_removed: 5,
                space_reclaimed: 1024 * 1024 * 500
            });
        }
        catch (error) {
            this.logger.error(`Prune job ${jobId} failed`, error);
            await this.failJob(jobId, error.message);
        }
    }
    async simulateBackup(jobId) {
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
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.updateJobProgress(jobId, steps[i], messages[i]);
        }
    }
    async simulateRestore(jobId) {
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
    async simulatePull(jobId) {
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
    async simulatePrune(jobId) {
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
};
exports.JobsService = JobsService;
__decorate([
    (0, bull_1.Process)('docker-backup'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], JobsService.prototype, "processVolumeBackup", null);
__decorate([
    (0, bull_1.Process)('docker-restore'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], JobsService.prototype, "processVolumeRestore", null);
__decorate([
    (0, bull_1.Process)('docker-pull'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], JobsService.prototype, "processImagePull", null);
__decorate([
    (0, bull_1.Process)('docker-prune'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], JobsService.prototype, "processPrune", null);
exports.JobsService = JobsService = JobsService_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, bull_1.Processor)('docker'),
    __param(0, (0, typeorm_1.InjectRepository)(docker_job_entity_1.DockerJob)),
    __param(1, (0, bull_1.InjectQueue)('docker')),
    __metadata("design:paramtypes", [typeorm_2.Repository, Object])
], JobsService);
//# sourceMappingURL=jobs.service.js.map