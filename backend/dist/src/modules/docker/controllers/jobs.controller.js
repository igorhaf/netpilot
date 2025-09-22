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
exports.JobsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../guards/jwt-auth.guard");
const jobs_service_1 = require("../services/jobs.service");
const docker_rbac_guard_1 = require("../guards/docker-rbac.guard");
let JobsController = class JobsController {
    constructor(jobsService) {
        this.jobsService = jobsService;
    }
    async getJobs(req, type, status, limit, offset) {
        const filters = {
            type: type,
            status: status,
            limit,
            offset,
            user_id: req.user.id
        };
        Object.keys(filters).forEach(key => {
            if (!filters[key])
                delete filters[key];
        });
        return await this.jobsService.getJobs(filters);
    }
    async getJob(id) {
        return await this.jobsService.getJob(id);
    }
};
exports.JobsController = JobsController;
__decorate([
    (0, common_1.Get)(),
    (0, docker_rbac_guard_1.RequireDockerPermission)(docker_rbac_guard_1.DockerPermission.VIEWER),
    (0, swagger_1.ApiOperation)({ summary: 'Listar jobs' }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, enum: ['backup', 'restore', 'pull', 'prune', 'exec'] }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['pending', 'running', 'completed', 'failed'] }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, example: 50 }),
    (0, swagger_1.ApiQuery)({ name: 'offset', required: false, type: Number, example: 0 }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de jobs retornada com sucesso' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(50), common_1.ParseIntPipe)),
    __param(4, (0, common_1.Query)('offset', new common_1.DefaultValuePipe(0), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "getJobs", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, docker_rbac_guard_1.RequireDockerPermission)(docker_rbac_guard_1.DockerPermission.VIEWER),
    (0, swagger_1.ApiOperation)({ summary: 'Status de job específico' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status do job' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Job não encontrado' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "getJob", null);
exports.JobsController = JobsController = __decorate([
    (0, swagger_1.ApiTags)('Docker Jobs'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('docker/jobs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, docker_rbac_guard_1.DockerRbacGuard),
    __metadata("design:paramtypes", [jobs_service_1.JobsService])
], JobsController);
//# sourceMappingURL=jobs.controller.js.map