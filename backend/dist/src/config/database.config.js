"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseConfig = void 0;
const user_entity_1 = require("../entities/user.entity");
const domain_entity_1 = require("../entities/domain.entity");
const proxy_rule_entity_1 = require("../entities/proxy-rule.entity");
const redirect_entity_1 = require("../entities/redirect.entity");
const ssl_certificate_entity_1 = require("../entities/ssl-certificate.entity");
const log_entity_1 = require("../entities/log.entity");
exports.databaseConfig = {
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [user_entity_1.User, domain_entity_1.Domain, proxy_rule_entity_1.ProxyRule, redirect_entity_1.Redirect, ssl_certificate_entity_1.SslCertificate, log_entity_1.Log],
    migrations: ['dist/migrations/*.js'],
    migrationsRun: true,
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development',
};
//# sourceMappingURL=database.config.js.map