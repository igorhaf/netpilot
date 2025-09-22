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
exports.DockerQuotaGuard = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const docker_quota_entity_1 = require("../entities/docker-quota.entity");
const cache_manager_1 = require("@nestjs/cache-manager");
const common_2 = require("@nestjs/common");
let DockerQuotaGuard = class DockerQuotaGuard {
    constructor(quotaRepo, cacheManager) {
        this.quotaRepo = quotaRepo;
        this.cacheManager = cacheManager;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            return true;
        }
        const action = context.getHandler().name;
        const rateLimitKey = `docker:rate_limit:${user.id}`;
        const currentCount = await this.cacheManager.get(rateLimitKey) || 0;
        let quota = await this.quotaRepo.findOne({
            where: { user: { id: user.id } },
            relations: ['user']
        });
        if (!quota) {
            quota = this.quotaRepo.create({
                user: user,
                max_containers: 10,
                max_volumes: 5,
                max_networks: 3,
                max_volume_size: 5368709120,
                max_actions_per_minute: 10,
                max_exec_timeout: 1800
            });
            await this.quotaRepo.save(quota);
        }
        const maxActions = quota.max_actions_per_minute;
        if (currentCount >= maxActions) {
            throw new common_1.BadRequestException(`Rate limit exceeded. Maximum ${maxActions} actions per minute.`);
        }
        await this.cacheManager.set(rateLimitKey, currentCount + 1, 60000);
        if (['createContainer', 'createVolume', 'createNetwork'].includes(action)) {
        }
        return true;
    }
};
exports.DockerQuotaGuard = DockerQuotaGuard;
exports.DockerQuotaGuard = DockerQuotaGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(docker_quota_entity_1.DockerQuota)),
    __param(1, (0, common_2.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [typeorm_2.Repository, Object])
], DockerQuotaGuard);
//# sourceMappingURL=docker-quota.guard.js.map