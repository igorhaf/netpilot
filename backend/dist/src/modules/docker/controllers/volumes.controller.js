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
exports.VolumesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../guards/jwt-auth.guard");
const volumes_service_1 = require("../services/volumes.service");
const docker_quota_guard_1 = require("../guards/docker-quota.guard");
const docker_rbac_guard_1 = require("../guards/docker-rbac.guard");
const create_volume_dto_1 = require("../dto/volumes/create-volume.dto");
const volume_backup_dto_1 = require("../dto/volumes/volume-backup.dto");
let VolumesController = class VolumesController {
    constructor(volumesService) {
        this.volumesService = volumesService;
    }
    async listVolumes(driver, dangling) {
        const filters = { driver, dangling };
        Object.keys(filters).forEach(key => {
            if (filters[key] === undefined || filters[key] === null)
                delete filters[key];
        });
        return await this.volumesService.listVolumes(filters);
    }
    async createVolume(createVolumeDto, req) {
        return await this.volumesService.createVolume(createVolumeDto, req.user);
    }
    async getVolume(name) {
        return await this.volumesService.getVolume(name);
    }
    async removeVolume(name, force, req) {
        await this.volumesService.removeVolume(name, force, req.user);
    }
    async createVolumeBackup(name, backupDto, req) {
        return await this.volumesService.createBackup(name, backupDto, req.user);
    }
    async getVolumeBackups(name) {
        return await this.volumesService.getBackups(name);
    }
};
exports.VolumesController = VolumesController;
__decorate([
    (0, common_1.Get)(),
    (0, docker_rbac_guard_1.RequireDockerPermission)(docker_rbac_guard_1.DockerPermission.VIEWER),
    (0, swagger_1.ApiOperation)({ summary: 'Listar volumes' }),
    (0, swagger_1.ApiQuery)({ name: 'driver', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'dangling', required: false, type: Boolean }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de volumes retornada com sucesso' }),
    __param(0, (0, common_1.Query)('driver')),
    __param(1, (0, common_1.Query)('dangling', new common_1.DefaultValuePipe(false), common_1.ParseBoolPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], VolumesController.prototype, "listVolumes", null);
__decorate([
    (0, common_1.Post)(),
    (0, docker_rbac_guard_1.RequireDockerPermission)(docker_rbac_guard_1.DockerPermission.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Criar volume' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Volume criado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Volume já existe' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_volume_dto_1.CreateVolumeDto, Object]),
    __metadata("design:returntype", Promise)
], VolumesController.prototype, "createVolume", null);
__decorate([
    (0, common_1.Get)(':name'),
    (0, docker_rbac_guard_1.RequireDockerPermission)(docker_rbac_guard_1.DockerPermission.VIEWER),
    (0, swagger_1.ApiOperation)({ summary: 'Inspecionar volume' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Detalhes do volume' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Volume não encontrado' }),
    __param(0, (0, common_1.Param)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VolumesController.prototype, "getVolume", null);
__decorate([
    (0, common_1.Delete)(':name'),
    (0, docker_rbac_guard_1.RequireDockerPermission)(docker_rbac_guard_1.DockerPermission.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Remover volume' }),
    (0, swagger_1.ApiQuery)({ name: 'force', required: false, type: Boolean }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Volume removido com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Volume não encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Volume está em uso' }),
    __param(0, (0, common_1.Param)('name')),
    __param(1, (0, common_1.Query)('force', new common_1.DefaultValuePipe(false), common_1.ParseBoolPipe)),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean, Object]),
    __metadata("design:returntype", Promise)
], VolumesController.prototype, "removeVolume", null);
__decorate([
    (0, common_1.Post)(':name/backup'),
    (0, docker_rbac_guard_1.RequireDockerPermission)(docker_rbac_guard_1.DockerPermission.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Criar backup do volume' }),
    (0, swagger_1.ApiResponse)({ status: 202, description: 'Backup iniciado' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Volume não encontrado' }),
    __param(0, (0, common_1.Param)('name')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, volume_backup_dto_1.VolumeBackupDto, Object]),
    __metadata("design:returntype", Promise)
], VolumesController.prototype, "createVolumeBackup", null);
__decorate([
    (0, common_1.Get)(':name/backups'),
    (0, docker_rbac_guard_1.RequireDockerPermission)(docker_rbac_guard_1.DockerPermission.VIEWER),
    (0, swagger_1.ApiOperation)({ summary: 'Listar backups do volume' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de backups' }),
    __param(0, (0, common_1.Param)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VolumesController.prototype, "getVolumeBackups", null);
exports.VolumesController = VolumesController = __decorate([
    (0, swagger_1.ApiTags)('Docker Volumes'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('api/docker/volumes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, docker_quota_guard_1.DockerQuotaGuard, docker_rbac_guard_1.DockerRbacGuard),
    __metadata("design:paramtypes", [volumes_service_1.VolumesService])
], VolumesController);
//# sourceMappingURL=volumes.controller.js.map