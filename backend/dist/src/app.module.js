"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("./modules/auth/auth.module");
const domains_module_1 = require("./modules/domains/domains.module");
const proxy_rules_module_1 = require("./modules/proxy-rules/proxy-rules.module");
const redirects_module_1 = require("./modules/redirects/redirects.module");
const ssl_certificates_module_1 = require("./modules/ssl-certificates/ssl-certificates.module");
const logs_module_1 = require("./modules/logs/logs.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const seed_module_1 = require("./seeds/seed.module");
const config_module_1 = require("./modules/config/config.module");
const user_entity_1 = require("./entities/user.entity");
const domain_entity_1 = require("./entities/domain.entity");
const proxy_rule_entity_1 = require("./entities/proxy-rule.entity");
const redirect_entity_1 = require("./entities/redirect.entity");
const ssl_certificate_entity_1 = require("./entities/ssl-certificate.entity");
const log_entity_1 = require("./entities/log.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    type: 'postgres',
                    url: configService.get('DATABASE_URL'),
                    entities: [user_entity_1.User, domain_entity_1.Domain, proxy_rule_entity_1.ProxyRule, redirect_entity_1.Redirect, ssl_certificate_entity_1.SslCertificate, log_entity_1.Log],
                    synchronize: process.env.NODE_ENV === 'development',
                    logging: process.env.NODE_ENV === 'development',
                }),
                inject: [config_1.ConfigService],
            }),
            config_module_1.ConfigModule,
            auth_module_1.AuthModule,
            domains_module_1.DomainsModule,
            proxy_rules_module_1.ProxyRulesModule,
            redirects_module_1.RedirectsModule,
            ssl_certificates_module_1.SslCertificatesModule,
            logs_module_1.LogsModule,
            dashboard_module_1.DashboardModule,
            seed_module_1.SeedModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map