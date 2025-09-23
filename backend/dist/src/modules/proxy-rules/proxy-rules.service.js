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
exports.ProxyRulesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const proxy_rule_entity_1 = require("../../entities/proxy-rule.entity");
const config_generation_service_1 = require("../../services/config-generation.service");
let ProxyRulesService = class ProxyRulesService {
    constructor(proxyRuleRepository, configGenerationService) {
        this.proxyRuleRepository = proxyRuleRepository;
        this.configGenerationService = configGenerationService;
    }
    async create(createProxyRuleDto) {
        const proxyRule = this.proxyRuleRepository.create(createProxyRuleDto);
        const saved = await this.proxyRuleRepository.save(proxyRule);
        await this.configGenerationService.generateNginxConfig();
        await this.configGenerationService.generateTraefikConfig();
        return this.findOne(saved.id);
    }
    async findAll(search, status) {
        const query = this.proxyRuleRepository.createQueryBuilder('proxyRule')
            .leftJoinAndSelect('proxyRule.domain', 'domain');
        if (search) {
            query.where('proxyRule.sourcePath ILIKE :search OR proxyRule.targetUrl ILIKE :search OR domain.name ILIKE :search', { search: `%${search}%` });
        }
        if (status) {
            query.andWhere('proxyRule.isActive = :isActive', {
                isActive: status === 'active',
            });
        }
        return query.orderBy('proxyRule.priority', 'DESC')
            .addOrderBy('proxyRule.createdAt', 'DESC')
            .getMany();
    }
    async findOne(id) {
        const proxyRule = await this.proxyRuleRepository.findOne({
            where: { id },
            relations: ['domain'],
        });
        if (!proxyRule) {
            throw new common_1.NotFoundException('Regra de proxy não encontrada');
        }
        return proxyRule;
    }
    async update(id, updateProxyRuleDto) {
        const proxyRule = await this.findOne(id);
        if (proxyRule.isLocked && !updateProxyRuleDto.hasOwnProperty('isLocked')) {
            throw new common_1.BadRequestException('Esta regra de proxy está travada e não pode ser editada. Destravar primeiro.');
        }
        Object.assign(proxyRule, updateProxyRuleDto);
        await this.proxyRuleRepository.save(proxyRule);
        await this.configGenerationService.generateNginxConfig();
        await this.configGenerationService.generateTraefikConfig();
        return this.findOne(id);
    }
    async toggleLock(id) {
        const proxyRule = await this.findOne(id);
        proxyRule.isLocked = !proxyRule.isLocked;
        await this.proxyRuleRepository.save(proxyRule);
        return this.findOne(id);
    }
    async remove(id) {
        const proxyRule = await this.findOne(id);
        if (proxyRule.isLocked) {
            throw new common_1.BadRequestException('Esta regra de proxy está travada e não pode ser excluída. Destravar primeiro.');
        }
        await this.proxyRuleRepository.remove(proxyRule);
        await this.configGenerationService.generateNginxConfig();
        await this.configGenerationService.generateTraefikConfig();
    }
    async applyConfiguration() {
        try {
            await this.configGenerationService.generateNginxConfig();
            await this.configGenerationService.generateTraefikConfig();
            return {
                success: true,
                message: 'Configuração aplicada com sucesso',
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Erro ao aplicar configuração: ${error.message}`,
            };
        }
    }
};
exports.ProxyRulesService = ProxyRulesService;
exports.ProxyRulesService = ProxyRulesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(proxy_rule_entity_1.ProxyRule)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_generation_service_1.ConfigGenerationService])
], ProxyRulesService);
//# sourceMappingURL=proxy-rules.service.js.map