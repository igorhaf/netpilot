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
exports.ProxyRulesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const proxy_rules_service_1 = require("./proxy-rules.service");
const proxy_rule_dto_1 = require("../../dtos/proxy-rule.dto");
const jwt_auth_guard_1 = require("../../guards/jwt-auth.guard");
let ProxyRulesController = class ProxyRulesController {
    constructor(proxyRulesService) {
        this.proxyRulesService = proxyRulesService;
    }
    create(createProxyRuleDto) {
        return this.proxyRulesService.create(createProxyRuleDto);
    }
    findAll(search, status) {
        return this.proxyRulesService.findAll(search, status);
    }
    applyConfiguration() {
        return this.proxyRulesService.applyConfiguration();
    }
    findOne(id) {
        return this.proxyRulesService.findOne(id);
    }
    update(id, updateProxyRuleDto) {
        return this.proxyRulesService.update(id, updateProxyRuleDto);
    }
    toggleLock(id) {
        return this.proxyRulesService.toggleLock(id);
    }
    remove(id) {
        return this.proxyRulesService.remove(id);
    }
};
exports.ProxyRulesController = ProxyRulesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Criar nova regra de proxy' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [proxy_rule_dto_1.CreateProxyRuleDto]),
    __metadata("design:returntype", void 0)
], ProxyRulesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar todas as regras de proxy' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ProxyRulesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('apply-configuration'),
    (0, swagger_1.ApiOperation)({ summary: 'Aplicar configuração das regras de proxy' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProxyRulesController.prototype, "applyConfiguration", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obter regra de proxy por ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProxyRulesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar regra de proxy' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, proxy_rule_dto_1.UpdateProxyRuleDto]),
    __metadata("design:returntype", void 0)
], ProxyRulesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/toggle-lock'),
    (0, swagger_1.ApiOperation)({ summary: 'Travar/destravar regra de proxy' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProxyRulesController.prototype, "toggleLock", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Remover regra de proxy' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProxyRulesController.prototype, "remove", null);
exports.ProxyRulesController = ProxyRulesController = __decorate([
    (0, swagger_1.ApiTags)('proxy-rules'),
    (0, common_1.Controller)('proxy-rules'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [proxy_rules_service_1.ProxyRulesService])
], ProxyRulesController);
//# sourceMappingURL=proxy-rules.controller.js.map