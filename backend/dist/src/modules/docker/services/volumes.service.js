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
var VolumesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VolumesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const docker_service_1 = require("./docker.service");
const docker_events_service_1 = require("./docker-events.service");
const docker_metrics_service_1 = require("./docker-metrics.service");
const jobs_service_1 = require("./jobs.service");
const docker_backup_entity_1 = require("../entities/docker-backup.entity");
let VolumesService = VolumesService_1 = class VolumesService {
    constructor(dockerService, eventsService, metricsService, jobsService, backupRepo) {
        this.dockerService = dockerService;
        this.eventsService = eventsService;
        this.metricsService = metricsService;
        this.jobsService = jobsService;
        this.backupRepo = backupRepo;
        this.logger = new common_1.Logger(VolumesService_1.name);
    }
    async listVolumes(filters) {
        try {
            const volumes = await this.dockerService.listVolumes(filters);
            this.metricsService.updateVolumeUsage(volumes);
            return volumes;
        }
        catch (error) {
            this.logger.error('Failed to list volumes', error);
            throw error;
        }
    }
    async createVolume(config, user) {
        const startTime = Date.now();
        try {
            const volumeName = await this.dockerService.createVolume(config);
            const volumeInfo = await this.dockerService.getVolume(volumeName);
            await this.eventsService.logEvent({
                action: 'create',
                resource_type: 'volume',
                resource_id: volumeName,
                resource_name: config.name,
                details: { driver: config.driver },
                result: 'success',
                user,
                ip_address: null,
                user_agent: null
            });
            return volumeInfo;
        }
        catch (error) {
            await this.eventsService.logEvent({
                action: 'create',
                resource_type: 'volume',
                resource_id: config.name,
                resource_name: config.name,
                details: { driver: config.driver },
                result: 'error',
                error_message: error.message,
                user,
                ip_address: null,
                user_agent: null
            });
            throw error;
        }
    }
    async getVolume(name) {
        return this.dockerService.getVolume(name);
    }
    async removeVolume(name, force, user) {
        const startTime = Date.now();
        try {
            await this.dockerService.removeVolume(name, force);
            await this.eventsService.logEvent({
                action: 'remove',
                resource_type: 'volume',
                resource_id: name,
                resource_name: name,
                details: { force },
                result: 'success',
                user,
                ip_address: null,
                user_agent: null
            });
        }
        catch (error) {
            await this.eventsService.logEvent({
                action: 'remove',
                resource_type: 'volume',
                resource_id: name,
                resource_name: name,
                details: { force },
                result: 'error',
                error_message: error.message,
                user,
                ip_address: null,
                user_agent: null
            });
            throw error;
        }
    }
    async createBackup(volumeName, options, user) {
        try {
            await this.dockerService.getVolume(volumeName);
            const job = await this.jobsService.createJob('backup', 'volume', volumeName, {
                description: options.description,
                tags: options.tags
            }, user);
            return {
                job_id: job.id,
                status_url: `/api/v1/docker/jobs/${job.id}`
            };
        }
        catch (error) {
            this.logger.error(`Failed to create backup for volume ${volumeName}`, error);
            throw error;
        }
    }
    async getBackups(volumeName) {
        return await this.backupRepo.find({
            where: { volume_name: volumeName },
            order: { created_at: 'DESC' },
            relations: ['created_by', 'restored_by']
        });
    }
    async restoreBackup(volumeName, backupId, force, user) {
        try {
            const backup = await this.backupRepo.findOne({
                where: { id: backupId, volume_name: volumeName }
            });
            if (!backup) {
                throw new Error('Backup not found');
            }
            const job = await this.jobsService.createJob('restore', 'volume', volumeName, {
                backup_id: backupId,
                force
            }, user);
            return {
                job_id: job.id,
                status_url: `/api/v1/docker/jobs/${job.id}`
            };
        }
        catch (error) {
            this.logger.error(`Failed to restore backup ${backupId} for volume ${volumeName}`, error);
            throw error;
        }
    }
};
exports.VolumesService = VolumesService;
exports.VolumesService = VolumesService = VolumesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, typeorm_1.InjectRepository)(docker_backup_entity_1.DockerBackup)),
    __metadata("design:paramtypes", [docker_service_1.DockerService,
        docker_events_service_1.DockerEventsService,
        docker_metrics_service_1.DockerMetricsService,
        jobs_service_1.JobsService,
        typeorm_2.Repository])
], VolumesService);
//# sourceMappingURL=volumes.service.js.map