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
exports.RedirectsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const redirect_entity_1 = require("../../entities/redirect.entity");
const config_generation_service_1 = require("../../services/config-generation.service");
let RedirectsService = class RedirectsService {
    constructor(redirectRepository, configGenerationService) {
        this.redirectRepository = redirectRepository;
        this.configGenerationService = configGenerationService;
    }
    async create(createRedirectDto) {
        const redirect = this.redirectRepository.create(createRedirectDto);
        const saved = await this.redirectRepository.save(redirect);
        await this.configGenerationService.generateNginxConfig();
        await this.configGenerationService.generateTraefikConfig();
        return this.findOne(saved.id);
    }
    async findAll(search, type, status) {
        const query = this.redirectRepository.createQueryBuilder('redirect')
            .leftJoinAndSelect('redirect.domain', 'domain');
        if (search) {
            query.where('redirect.sourcePattern ILIKE :search OR redirect.targetUrl ILIKE :search OR domain.name ILIKE :search', { search: `%${search}%` });
        }
        if (type) {
            query.andWhere('redirect.type = :type', { type });
        }
        if (status) {
            query.andWhere('redirect.isActive = :isActive', {
                isActive: status === 'active',
            });
        }
        return query.orderBy('redirect.priority', 'DESC')
            .addOrderBy('redirect.createdAt', 'DESC')
            .getMany();
    }
    async findOne(id) {
        const redirect = await this.redirectRepository.findOne({
            where: { id },
            relations: ['domain'],
        });
        if (!redirect) {
            throw new common_1.NotFoundException('Redirect não encontrado');
        }
        return redirect;
    }
    async update(id, updateRedirectDto) {
        const redirect = await this.findOne(id);
        Object.assign(redirect, updateRedirectDto);
        await this.redirectRepository.save(redirect);
        await this.configGenerationService.generateNginxConfig();
        await this.configGenerationService.generateTraefikConfig();
        return this.findOne(id);
    }
    async remove(id) {
        const redirect = await this.findOne(id);
        await this.redirectRepository.remove(redirect);
        await this.configGenerationService.generateNginxConfig();
        await this.configGenerationService.generateTraefikConfig();
    }
};
exports.RedirectsService = RedirectsService;
exports.RedirectsService = RedirectsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(redirect_entity_1.Redirect)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_generation_service_1.ConfigGenerationService])
], RedirectsService);
//# sourceMappingURL=redirects.service.js.map