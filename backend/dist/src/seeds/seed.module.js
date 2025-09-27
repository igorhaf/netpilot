"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const initial_seed_1 = require("./initial-seed");
const user_entity_1 = require("../entities/user.entity");
const project_entity_1 = require("../entities/project.entity");
const domain_entity_1 = require("../entities/domain.entity");
const proxy_rule_entity_1 = require("../entities/proxy-rule.entity");
const redirect_entity_1 = require("../entities/redirect.entity");
const ssl_certificate_entity_1 = require("../entities/ssl-certificate.entity");
const log_entity_1 = require("../entities/log.entity");
let SeedModule = class SeedModule {
};
exports.SeedModule = SeedModule;
exports.SeedModule = SeedModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                user_entity_1.User,
                project_entity_1.Project,
                domain_entity_1.Domain,
                proxy_rule_entity_1.ProxyRule,
                redirect_entity_1.Redirect,
                ssl_certificate_entity_1.SslCertificate,
                log_entity_1.Log,
            ]),
        ],
        providers: [initial_seed_1.InitialSeedService],
        exports: [initial_seed_1.InitialSeedService],
    })
], SeedModule);
//# sourceMappingURL=seed.module.js.map