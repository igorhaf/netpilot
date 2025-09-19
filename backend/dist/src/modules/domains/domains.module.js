"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const domains_controller_1 = require("./domains.controller");
const domains_service_1 = require("./domains.service");
const domain_entity_1 = require("../../entities/domain.entity");
const config_generation_service_1 = require("../../services/config-generation.service");
const config_module_1 = require("../config/config.module");
let DomainsModule = class DomainsModule {
};
exports.DomainsModule = DomainsModule;
exports.DomainsModule = DomainsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([domain_entity_1.Domain]), config_module_1.ConfigModule],
        controllers: [domains_controller_1.DomainsController],
        providers: [domains_service_1.DomainsService, config_generation_service_1.ConfigGenerationService],
        exports: [domains_service_1.DomainsService],
    })
], DomainsModule);
//# sourceMappingURL=domains.module.js.map