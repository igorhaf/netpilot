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
var ImagesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImagesService = void 0;
const common_1 = require("@nestjs/common");
const docker_service_1 = require("./docker.service");
const docker_events_service_1 = require("./docker-events.service");
const jobs_service_1 = require("./jobs.service");
let ImagesService = ImagesService_1 = class ImagesService {
    constructor(dockerService, eventsService, jobsService) {
        this.dockerService = dockerService;
        this.eventsService = eventsService;
        this.jobsService = jobsService;
        this.logger = new common_1.Logger(ImagesService_1.name);
    }
    async listImages(filters) {
        try {
            return await this.dockerService.listImages(filters);
        }
        catch (error) {
            this.logger.error('Failed to list images', error);
            throw error;
        }
    }
    async getImage(id) {
        return this.dockerService.getImage(id);
    }
    async pullImage(reference, auth, user) {
        try {
            const job = await this.jobsService.createJob('pull', 'image', reference, { auth }, user);
            return {
                job_id: job.id,
                status_url: `/api/v1/docker/jobs/${job.id}`,
                websocket_url: `/ws/docker/images/pull/${job.id}`
            };
        }
        catch (error) {
            this.logger.error(`Failed to pull image ${reference}`, error);
            throw error;
        }
    }
    async removeImage(id, force, noprune, user) {
        try {
            const result = await this.dockerService.removeImage(id, force, noprune);
            await this.eventsService.logEvent({
                action: 'remove',
                resource_type: 'image',
                resource_id: id,
                details: { force, noprune },
                result: 'success',
                user,
                ip_address: null,
                user_agent: null
            });
            return result;
        }
        catch (error) {
            await this.eventsService.logEvent({
                action: 'remove',
                resource_type: 'image',
                resource_id: id,
                details: { force, noprune },
                result: 'error',
                error_message: error.message,
                user,
                ip_address: null,
                user_agent: null
            });
            throw error;
        }
    }
    async pruneImages(options, user) {
        try {
            if (options.dry_run) {
                const result = await this.dockerService.pruneImages(options.dangling_only, options.until ? new Date(options.until) : undefined);
                return {
                    ...result,
                    dry_run: true,
                    message: 'This is a preview. Use dry_run=false to actually remove images.'
                };
            }
            const job = await this.jobsService.createJob('prune', 'image', 'all', {
                dangling_only: options.dangling_only,
                until: options.until
            }, user);
            return {
                job_id: job.id,
                status_url: `/api/v1/docker/jobs/${job.id}`
            };
        }
        catch (error) {
            this.logger.error('Failed to prune images', error);
            throw error;
        }
    }
};
exports.ImagesService = ImagesService;
exports.ImagesService = ImagesService = ImagesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [docker_service_1.DockerService,
        docker_events_service_1.DockerEventsService,
        jobs_service_1.JobsService])
], ImagesService);
//# sourceMappingURL=images.service.js.map