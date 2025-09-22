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
var NetworksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworksService = void 0;
const common_1 = require("@nestjs/common");
const docker_service_1 = require("./docker.service");
const docker_events_service_1 = require("./docker-events.service");
let NetworksService = NetworksService_1 = class NetworksService {
    constructor(dockerService, eventsService) {
        this.dockerService = dockerService;
        this.eventsService = eventsService;
        this.logger = new common_1.Logger(NetworksService_1.name);
    }
    async listNetworks(filters) {
        try {
            return await this.dockerService.listNetworks(filters);
        }
        catch (error) {
            this.logger.error('Failed to list networks', error);
            throw error;
        }
    }
    async createNetwork(config, user) {
        try {
            const networkId = await this.dockerService.createNetwork(config);
            const networkInfo = await this.dockerService.getNetwork(networkId);
            await this.eventsService.logEvent({
                action: 'create',
                resource_type: 'network',
                resource_id: networkId,
                resource_name: config.name,
                details: { driver: config.driver },
                result: 'success',
                user,
                ip_address: null,
                user_agent: null
            });
            return networkInfo;
        }
        catch (error) {
            await this.eventsService.logEvent({
                action: 'create',
                resource_type: 'network',
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
    async getNetwork(id) {
        return this.dockerService.getNetwork(id);
    }
    async removeNetwork(id, user) {
        try {
            await this.dockerService.removeNetwork(id);
            await this.eventsService.logEvent({
                action: 'remove',
                resource_type: 'network',
                resource_id: id,
                result: 'success',
                user,
                ip_address: null,
                user_agent: null
            });
        }
        catch (error) {
            await this.eventsService.logEvent({
                action: 'remove',
                resource_type: 'network',
                resource_id: id,
                result: 'error',
                error_message: error.message,
                user,
                ip_address: null,
                user_agent: null
            });
            throw error;
        }
    }
    async connectContainer(networkId, connectDto, user) {
        try {
            if (connectDto.dry_run) {
                await this.dockerService.getNetwork(networkId);
                return { message: 'Dry run successful - container can be connected' };
            }
            await this.dockerService.connectContainer(networkId, connectDto.container, {
                aliases: connectDto.aliases,
                ipv4_address: connectDto.ipv4_address
            });
            await this.eventsService.logEvent({
                action: 'connect',
                resource_type: 'network',
                resource_id: networkId,
                details: { container: connectDto.container },
                result: 'success',
                user,
                ip_address: null,
                user_agent: null
            });
            return { message: 'Container connected successfully' };
        }
        catch (error) {
            await this.eventsService.logEvent({
                action: 'connect',
                resource_type: 'network',
                resource_id: networkId,
                details: { container: connectDto.container },
                result: 'error',
                error_message: error.message,
                user,
                ip_address: null,
                user_agent: null
            });
            throw error;
        }
    }
    async disconnectContainer(networkId, disconnectDto, user) {
        try {
            await this.dockerService.disconnectContainer(networkId, disconnectDto.container, disconnectDto.force);
            await this.eventsService.logEvent({
                action: 'disconnect',
                resource_type: 'network',
                resource_id: networkId,
                details: { container: disconnectDto.container, force: disconnectDto.force },
                result: 'success',
                user,
                ip_address: null,
                user_agent: null
            });
            return { message: 'Container disconnected successfully' };
        }
        catch (error) {
            await this.eventsService.logEvent({
                action: 'disconnect',
                resource_type: 'network',
                resource_id: networkId,
                details: { container: disconnectDto.container, force: disconnectDto.force },
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
exports.NetworksService = NetworksService;
exports.NetworksService = NetworksService = NetworksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [docker_service_1.DockerService,
        docker_events_service_1.DockerEventsService])
], NetworksService);
//# sourceMappingURL=networks.service.js.map