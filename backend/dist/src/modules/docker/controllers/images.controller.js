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
exports.ImagesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../guards/jwt-auth.guard");
const images_service_1 = require("../services/images.service");
const docker_quota_guard_1 = require("../guards/docker-quota.guard");
const docker_rbac_guard_1 = require("../guards/docker-rbac.guard");
let ImagesController = class ImagesController {
    constructor(imagesService) {
        this.imagesService = imagesService;
    }
    async listImages(dangling, reference) {
        const filters = { dangling, reference };
        Object.keys(filters).forEach(key => {
            if (filters[key] === undefined || filters[key] === null)
                delete filters[key];
        });
        return await this.imagesService.listImages(filters);
    }
    async pullImage(pullDto, req) {
        return await this.imagesService.pullImage(pullDto.reference, pullDto.auth, req.user);
    }
    async getImage(id) {
        return await this.imagesService.getImage(id);
    }
    async removeImage(id, req, force, noprune) {
        return await this.imagesService.removeImage(id, force, noprune, req.user);
    }
    async pruneImages(pruneDto, req) {
        return await this.imagesService.pruneImages(pruneDto, req.user);
    }
};
exports.ImagesController = ImagesController;
__decorate([
    (0, common_1.Get)(),
    (0, docker_rbac_guard_1.RequireDockerPermission)(docker_rbac_guard_1.DockerPermission.VIEWER),
    (0, swagger_1.ApiOperation)({ summary: 'Listar imagens' }),
    (0, swagger_1.ApiQuery)({ name: 'dangling', required: false, type: Boolean }),
    (0, swagger_1.ApiQuery)({ name: 'reference', required: false, type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de imagens retornada com sucesso' }),
    __param(0, (0, common_1.Query)('dangling', new common_1.DefaultValuePipe(false), common_1.ParseBoolPipe)),
    __param(1, (0, common_1.Query)('reference')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean, String]),
    __metadata("design:returntype", Promise)
], ImagesController.prototype, "listImages", null);
__decorate([
    (0, common_1.Post)('pull'),
    (0, docker_rbac_guard_1.RequireDockerPermission)(docker_rbac_guard_1.DockerPermission.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Fazer pull de imagem' }),
    (0, swagger_1.ApiResponse)({ status: 202, description: 'Pull iniciado' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Imagem não encontrada no registry' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ImagesController.prototype, "pullImage", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, docker_rbac_guard_1.RequireDockerPermission)(docker_rbac_guard_1.DockerPermission.VIEWER),
    (0, swagger_1.ApiOperation)({ summary: 'Inspecionar imagem' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Detalhes da imagem' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Imagem não encontrada' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ImagesController.prototype, "getImage", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, docker_rbac_guard_1.RequireDockerPermission)(docker_rbac_guard_1.DockerPermission.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Remover imagem' }),
    (0, swagger_1.ApiQuery)({ name: 'force', required: false, type: Boolean }),
    (0, swagger_1.ApiQuery)({ name: 'noprune', required: false, type: Boolean }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Imagem removida com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Imagem não encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Imagem está sendo usada por containers' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Query)('force', new common_1.DefaultValuePipe(false), common_1.ParseBoolPipe)),
    __param(3, (0, common_1.Query)('noprune', new common_1.DefaultValuePipe(false), common_1.ParseBoolPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Boolean, Boolean]),
    __metadata("design:returntype", Promise)
], ImagesController.prototype, "removeImage", null);
__decorate([
    (0, common_1.Post)('prune'),
    (0, docker_rbac_guard_1.RequireDockerPermission)(docker_rbac_guard_1.DockerPermission.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Limpar imagens não utilizadas' }),
    (0, swagger_1.ApiResponse)({ status: 202, description: 'Limpeza iniciada' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ImagesController.prototype, "pruneImages", null);
exports.ImagesController = ImagesController = __decorate([
    (0, swagger_1.ApiTags)('Docker Images'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('api/docker/images'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, docker_quota_guard_1.DockerQuotaGuard, docker_rbac_guard_1.DockerRbacGuard),
    __metadata("design:paramtypes", [images_service_1.ImagesService])
], ImagesController);
//# sourceMappingURL=images.controller.js.map