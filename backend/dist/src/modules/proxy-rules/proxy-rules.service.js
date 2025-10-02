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
const logs_service_1 = require("../logs/logs.service");
const log_entity_1 = require("../../entities/log.entity");
let ProxyRulesService = class ProxyRulesService {
    constructor(proxyRuleRepository, configGenerationService, logsService) {
        this.proxyRuleRepository = proxyRuleRepository;
        this.configGenerationService = configGenerationService;
        this.logsService = logsService;
    }
    async create(createProxyRuleDto) {
        const log = await this.logsService.createLog(log_entity_1.LogType.PROXY_RULE, 'Criar regra de proxy', `Criando regra de proxy para ${createProxyRuleDto.sourcePath}`);
        try {
            const proxyRule = this.proxyRuleRepository.create(createProxyRuleDto);
            const saved = await this.proxyRuleRepository.save(proxyRule);
            await this.configGenerationService.generateNginxConfig();
            await this.configGenerationService.generateTraefikConfig();
            await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.SUCCESS, `Regra de proxy criada: ${saved.sourcePath} → ${saved.targetUrl}`, JSON.stringify({ id: saved.id, sourcePath: saved.sourcePath }));
            return this.findOne(saved.id);
        }
        catch (error) {
            await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.FAILED, error.message || 'Erro ao criar regra de proxy', error.stack);
            throw error;
        }
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
        const log = await this.logsService.createLog(log_entity_1.LogType.PROXY_RULE, 'Atualizar regra de proxy', `Atualizando regra de proxy ${id}`);
        try {
            const proxyRule = await this.findOne(id);
            if (proxyRule.isLocked && !updateProxyRuleDto.hasOwnProperty('isLocked')) {
                await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.FAILED, 'Regra de proxy está travada');
                throw new common_1.BadRequestException('Esta regra de proxy está travada e não pode ser editada. Destravar primeiro.');
            }
            Object.assign(proxyRule, updateProxyRuleDto);
            await this.proxyRuleRepository.save(proxyRule);
            await this.configGenerationService.generateNginxConfig();
            await this.configGenerationService.generateTraefikConfig();
            await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.SUCCESS, `Regra de proxy atualizada: ${proxyRule.sourcePath}`, JSON.stringify({ id: proxyRule.id, changes: updateProxyRuleDto }));
            return this.findOne(id);
        }
        catch (error) {
            await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.FAILED, error.message || 'Erro ao atualizar regra de proxy', error.stack);
            throw error;
        }
    }
    async toggleLock(id) {
        const proxyRule = await this.findOne(id);
        proxyRule.isLocked = !proxyRule.isLocked;
        await this.proxyRuleRepository.save(proxyRule);
        return this.findOne(id);
    }
    async remove(id) {
        const log = await this.logsService.createLog(log_entity_1.LogType.PROXY_RULE, 'Remover regra de proxy', `Removendo regra de proxy ${id}`);
        try {
            const proxyRule = await this.findOne(id);
            const sourcePath = proxyRule.sourcePath;
            if (proxyRule.isLocked) {
                await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.FAILED, 'Regra de proxy está travada');
                throw new common_1.BadRequestException('Esta regra de proxy está travada e não pode ser excluída. Destravar primeiro.');
            }
            await this.proxyRuleRepository.remove(proxyRule);
            await this.configGenerationService.generateNginxConfig();
            await this.configGenerationService.generateTraefikConfig();
            await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.SUCCESS, `Regra de proxy removida: ${sourcePath}`);
        }
        catch (error) {
            await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.FAILED, error.message || 'Erro ao remover regra de proxy', error.stack);
            throw error;
        }
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
        config_generation_service_1.ConfigGenerationService,
        logs_service_1.LogsService])
], ProxyRulesService);
//# sourceMappingURL=proxy-rules.service.js.map