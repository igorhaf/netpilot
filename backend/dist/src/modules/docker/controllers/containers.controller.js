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
exports.ContainersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../guards/jwt-auth.guard");
const containers_service_1 = require("../services/containers.service");
const docker_quota_guard_1 = require("../guards/docker-quota.guard");
const create_container_dto_1 = require("../dto/containers/create-container.dto");
const container_action_dto_1 = require("../dto/containers/container-action.dto");
const container_exec_dto_1 = require("../dto/containers/container-exec.dto");
let ContainersController = class ContainersController {
    constructor(containersService) {
        this.containersService = containersService;
    }
    async listContainers(status, image, name, label, page, limit) {
        const filters = { status, image, name, label };
        Object.keys(filters).forEach(key => {
            if (!filters[key])
                delete filters[key];
        });
        const result = await this.containersService.listContainers(filters);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = result.data.slice(startIndex, endIndex);
        return {
            data: paginatedData,
            pagination: {
                page,
                limit,
                total: result.total,
                pages: Math.ceil(result.total / limit)
            }
        };
    }
    async createContainer(createContainerDto, req) {
        return await this.containersService.createContainer(createContainerDto, req.user);
    }
    async getContainer(id) {
        return await this.containersService.getContainer(id);
    }
    async removeContainer(id, force, req) {
        await this.containersService.removeContainer(id, force, req.user);
    }
    async containerAction(id, action, actionDto, req) {
        await this.containersService.containerAction(id, action, actionDto, req.user);
        return {
            message: `Container ${action} executado com sucesso`,
            status: 'success'
        };
    }
    async getContainerLogs(id, tail, since, until, follow) {
        const options = {
            tail,
            since: since ? new Date(since) : undefined,
            until: until ? new Date(until) : undefined,
            follow
        };
        const logs = await this.containersService.getContainerLogs(id, options);
        const response = { logs };
        if (follow) {
            response.websocket_url = `/ws/docker/containers/${id}/logs`;
        }
        return response;
    }
    async execContainer(id, execDto, req) {
        return await this.containersService.createExecSession(id, execDto.cmd, {
            interactive: execDto.interactive,
            tty: execDto.tty,
            env: execDto.env
        }, req.user);
    }
    async getContainerStats(id, stream) {
        if (stream) {
            return {
                websocket_url: `/ws/docker/containers/${id}/stats`
            };
        }
        return await this.containersService.getContainerStats(id);
    }
};
exports.ContainersController = ContainersController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar containers' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['running', 'exited', 'paused', 'created', 'restarting', 'removing', 'dead'] }),
    (0, swagger_1.ApiQuery)({ name: 'image', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'name', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'label', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, example: 50 }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de containers retornada com sucesso' }),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('image')),
    __param(2, (0, common_1.Query)('name')),
    __param(3, (0, common_1.Query)('label')),
    __param(4, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(5, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(50), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], ContainersController.prototype, "listContainers", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Criar container' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Container criado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Imagem não encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Nome do container já existe' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_container_dto_1.CreateContainerDto, Object]),
    __metadata("design:returntype", Promise)
], ContainersController.prototype, "createContainer", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Inspecionar container' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Detalhes do container' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Container não encontrado' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ContainersController.prototype, "getContainer", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Remover container' }),
    (0, swagger_1.ApiQuery)({ name: 'force', required: false, type: Boolean }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Container removido com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Container não encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Container está rodando e não pode ser removido' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('force', new common_1.DefaultValuePipe(false), common_1.ParseBoolPipe)),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean, Object]),
    __metadata("design:returntype", Promise)
], ContainersController.prototype, "removeContainer", null);
__decorate([
    (0, common_1.Post)(':id/actions/:action'),
    (0, swagger_1.ApiOperation)({ summary: 'Executar ação no container' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Ação executada com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Container não encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Ação não pode ser executada no estado atual' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('action')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, container_action_dto_1.ContainerActionDto, Object]),
    __metadata("design:returntype", Promise)
], ContainersController.prototype, "containerAction", null);
__decorate([
    (0, common_1.Get)(':id/logs'),
    (0, swagger_1.ApiOperation)({ summary: 'Obter logs do container' }),
    (0, swagger_1.ApiQuery)({ name: 'tail', required: false, type: Number, example: 100 }),
    (0, swagger_1.ApiQuery)({ name: 'since', required: false, type: String, description: 'ISO datetime' }),
    (0, swagger_1.ApiQuery)({ name: 'until', required: false, type: String, description: 'ISO datetime' }),
    (0, swagger_1.ApiQuery)({ name: 'follow', required: false, type: Boolean }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Logs do container' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Container não encontrado' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('tail', new common_1.DefaultValuePipe(100), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('since')),
    __param(3, (0, common_1.Query)('until')),
    __param(4, (0, common_1.Query)('follow', new common_1.DefaultValuePipe(false), common_1.ParseBoolPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String, String, Boolean]),
    __metadata("design:returntype", Promise)
], ContainersController.prototype, "getContainerLogs", null);
__decorate([
    (0, common_1.Post)(':id/exec'),
    (0, swagger_1.ApiOperation)({ summary: 'Executar comando no container' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Comando executado' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Container não encontrado' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, container_exec_dto_1.ContainerExecDto, Object]),
    __metadata("design:returntype", Promise)
], ContainersController.prototype, "execContainer", null);
__decorate([
    (0, common_1.Get)(':id/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Estatísticas do container' }),
    (0, swagger_1.ApiQuery)({ name: 'stream', required: false, type: Boolean }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Estatísticas do container' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Container não encontrado' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('stream', new common_1.DefaultValuePipe(false), common_1.ParseBoolPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], ContainersController.prototype, "getContainerStats", null);
exports.ContainersController = ContainersController = __decorate([
    (0, swagger_1.ApiTags)('Docker Containers'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('api/docker/containers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, docker_quota_guard_1.DockerQuotaGuard),
    __metadata("design:paramtypes", [containers_service_1.ContainersService])
], ContainersController);
//# sourceMappingURL=containers.controller.js.map