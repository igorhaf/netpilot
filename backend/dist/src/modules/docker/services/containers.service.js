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
var ContainersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContainersService = void 0;
const common_1 = require("@nestjs/common");
const docker_service_1 = require("./docker.service");
const docker_events_service_1 = require("./docker-events.service");
const docker_metrics_service_1 = require("./docker-metrics.service");
let ContainersService = ContainersService_1 = class ContainersService {
    constructor(dockerService, eventsService, metricsService) {
        this.dockerService = dockerService;
        this.eventsService = eventsService;
        this.metricsService = metricsService;
        this.logger = new common_1.Logger(ContainersService_1.name);
    }
    async listContainers(filters) {
        const startTime = Date.now();
        try {
            const containers = await this.dockerService.listContainers(filters);
            this.metricsService.updateContainerStats(containers);
            return {
                data: containers,
                total: containers.length
            };
        }
        catch (error) {
            this.logger.error('Failed to list containers', error);
            throw error;
        }
    }
    async createContainer(config, user) {
        const startTime = Date.now();
        try {
            const containerId = await this.dockerService.createContainer(config);
            const containerInfo = await this.dockerService.getContainer(containerId);
            await this.eventsService.logEvent({
                action: 'create',
                resource_type: 'container',
                resource_id: containerId,
                resource_name: config.name,
                details: { image: config.image },
                result: 'success',
                user,
                ip_address: null,
                user_agent: null
            });
            const duration = (Date.now() - startTime) / 1000;
            this.metricsService.recordContainerAction('create', 'success', user.id, duration);
            return {
                id: containerInfo.id,
                name: containerInfo.name,
                image: config.image,
                image_id: containerInfo.config?.Image || '',
                status: 'Created',
                state: 'created',
                created: new Date(),
                ports: [],
                labels: config.labels || {},
                networks: config.networks || [],
                mounts: []
            };
        }
        catch (error) {
            await this.eventsService.logEvent({
                action: 'create',
                resource_type: 'container',
                resource_id: 'unknown',
                resource_name: config.name,
                details: { image: config.image },
                result: 'error',
                error_message: error.message,
                user,
                ip_address: null,
                user_agent: null
            });
            const duration = (Date.now() - startTime) / 1000;
            this.metricsService.recordContainerAction('create', 'error', user.id, duration);
            throw error;
        }
    }
    async getContainer(id) {
        return this.dockerService.getContainer(id);
    }
    async containerAction(id, action, options, user) {
        const startTime = Date.now();
        try {
            await this.dockerService.containerAction(id, action, options);
            await this.eventsService.logEvent({
                action,
                resource_type: 'container',
                resource_id: id,
                details: options,
                result: 'success',
                user,
                ip_address: null,
                user_agent: null
            });
            const duration = (Date.now() - startTime) / 1000;
            this.metricsService.recordContainerAction(action, 'success', user.id, duration);
        }
        catch (error) {
            await this.eventsService.logEvent({
                action,
                resource_type: 'container',
                resource_id: id,
                details: options,
                result: 'error',
                error_message: error.message,
                user,
                ip_address: null,
                user_agent: null
            });
            const duration = (Date.now() - startTime) / 1000;
            this.metricsService.recordContainerAction(action, 'error', user.id, duration);
            throw error;
        }
    }
    async removeContainer(id, force, user) {
        const startTime = Date.now();
        try {
            await this.dockerService.removeContainer(id, force);
            await this.eventsService.logEvent({
                action: 'remove',
                resource_type: 'container',
                resource_id: id,
                details: { force },
                result: 'success',
                user,
                ip_address: null,
                user_agent: null
            });
            const duration = (Date.now() - startTime) / 1000;
            this.metricsService.recordContainerAction('remove', 'success', user.id, duration);
        }
        catch (error) {
            await this.eventsService.logEvent({
                action: 'remove',
                resource_type: 'container',
                resource_id: id,
                details: { force },
                result: 'error',
                error_message: error.message,
                user,
                ip_address: null,
                user_agent: null
            });
            const duration = (Date.now() - startTime) / 1000;
            this.metricsService.recordContainerAction('remove', 'error', user.id, duration);
            throw error;
        }
    }
    async getContainerLogs(id, options) {
        try {
            return await this.dockerService.getContainerLogs(id, options);
        }
        catch (error) {
            this.logger.error(`Failed to get logs for container ${id}`, error);
            throw error;
        }
    }
    async getContainerStats(id) {
        try {
            return await this.dockerService.getContainerStats(id);
        }
        catch (error) {
            this.logger.error(`Failed to get stats for container ${id}`, error);
            throw error;
        }
    }
    async createExecSession(id, command, options, user) {
        try {
            await this.eventsService.logEvent({
                action: 'exec',
                resource_type: 'container',
                resource_id: id,
                details: { command, options },
                result: 'success',
                user,
                ip_address: null,
                user_agent: null
            });
            return {
                exec_id: 'mock-exec-id',
                websocket_url: `/ws/docker/containers/${id}/exec/mock-exec-id`
            };
        }
        catch (error) {
            await this.eventsService.logEvent({
                action: 'exec',
                resource_type: 'container',
                resource_id: id,
                details: { command, options },
                result: 'error',
                error_message: error.message,
                user,
                ip_address: null,
                user_agent: null
            });
            throw error;
        }
    }
};
exports.ContainersService = ContainersService;
exports.ContainersService = ContainersService = ContainersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [docker_service_1.DockerService,
        docker_events_service_1.DockerEventsService,
        docker_metrics_service_1.DockerMetricsService])
], ContainersService);
//# sourceMappingURL=containers.service.js.map