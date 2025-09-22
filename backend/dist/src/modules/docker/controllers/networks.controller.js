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
exports.NetworksController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../guards/jwt-auth.guard");
const networks_service_1 = require("../services/networks.service");
const docker_quota_guard_1 = require("../guards/docker-quota.guard");
const docker_rbac_guard_1 = require("../guards/docker-rbac.guard");
let NetworksController = class NetworksController {
    constructor(networksService) {
        this.networksService = networksService;
    }
    async listNetworks(driver, scope) {
        const filters = { driver, scope };
        Object.keys(filters).forEach(key => {
            if (!filters[key])
                delete filters[key];
        });
        return await this.networksService.listNetworks(filters);
    }
    async createNetwork(createNetworkDto, req) {
        return await this.networksService.createNetwork(createNetworkDto, req.user);
    }
    async getNetwork(id) {
        return await this.networksService.getNetwork(id);
    }
    async removeNetwork(id, req) {
        await this.networksService.removeNetwork(id, req.user);
    }
    async connectContainer(id, connectDto, req) {
        return await this.networksService.connectContainer(id, connectDto, req.user);
    }
    async disconnectContainer(id, disconnectDto, req) {
        return await this.networksService.disconnectContainer(id, disconnectDto, req.user);
    }
};
exports.NetworksController = NetworksController;
__decorate([
    (0, common_1.Get)(),
    (0, docker_rbac_guard_1.RequireDockerPermission)(docker_rbac_guard_1.DockerPermission.VIEWER),
    (0, swagger_1.ApiOperation)({ summary: 'Listar redes' }),
    (0, swagger_1.ApiQuery)({ name: 'driver', required: false, enum: ['bridge', 'host', 'overlay', 'macvlan'] }),
    (0, swagger_1.ApiQuery)({ name: 'scope', required: false, enum: ['local', 'global', 'swarm'] }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de redes retornada com sucesso' }),
    __param(0, (0, common_1.Query)('driver')),
    __param(1, (0, common_1.Query)('scope')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], NetworksController.prototype, "listNetworks", null);
__decorate([
    (0, common_1.Post)(),
    (0, docker_rbac_guard_1.RequireDockerPermission)(docker_rbac_guard_1.DockerPermission.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Criar rede' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Rede criada com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Rede já existe' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], NetworksController.prototype, "createNetwork", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, docker_rbac_guard_1.RequireDockerPermission)(docker_rbac_guard_1.DockerPermission.VIEWER),
    (0, swagger_1.ApiOperation)({ summary: 'Inspecionar rede' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Detalhes da rede' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Rede não encontrada' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NetworksController.prototype, "getNetwork", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, docker_rbac_guard_1.RequireDockerPermission)(docker_rbac_guard_1.DockerPermission.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Remover rede' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Rede removida com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Rede não encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Rede está em uso' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NetworksController.prototype, "removeNetwork", null);
__decorate([
    (0, common_1.Post)(':id/connect'),
    (0, docker_rbac_guard_1.RequireDockerPermission)(docker_rbac_guard_1.DockerPermission.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Conectar container à rede' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Container conectado com sucesso' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], NetworksController.prototype, "connectContainer", null);
__decorate([
    (0, common_1.Post)(':id/disconnect'),
    (0, docker_rbac_guard_1.RequireDockerPermission)(docker_rbac_guard_1.DockerPermission.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Desconectar container da rede' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Container desconectado com sucesso' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], NetworksController.prototype, "disconnectContainer", null);
exports.NetworksController = NetworksController = __decorate([
    (0, swagger_1.ApiTags)('Docker Networks'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('api/docker/networks'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, docker_quota_guard_1.DockerQuotaGuard, docker_rbac_guard_1.DockerRbacGuard),
    __metadata("design:paramtypes", [networks_service_1.NetworksService])
], NetworksController);
//# sourceMappingURL=networks.controller.js.map