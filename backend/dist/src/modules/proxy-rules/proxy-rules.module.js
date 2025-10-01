"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyRulesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const proxy_rules_controller_1 = require("./proxy-rules.controller");
const proxy_rules_service_1 = require("./proxy-rules.service");
const proxy_rule_entity_1 = require("../../entities/proxy-rule.entity");
const domain_entity_1 = require("../../entities/domain.entity");
const config_generation_service_1 = require("../../services/config-generation.service");
const config_module_1 = require("../config/config.module");
let ProxyRulesModule = class ProxyRulesModule {
};
exports.ProxyRulesModule = ProxyRulesModule;
exports.ProxyRulesModule = ProxyRulesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([proxy_rule_entity_1.ProxyRule, domain_entity_1.Domain]),
            config_module_1.ConfigModule,
            axios_1.HttpModule,
            config_1.ConfigModule,
        ],
        controllers: [proxy_rules_controller_1.ProxyRulesController],
        providers: [proxy_rules_service_1.ProxyRulesService, config_generation_service_1.ConfigGenerationService],
    })
], ProxyRulesModule);
//# sourceMappingURL=proxy-rules.module.js.map