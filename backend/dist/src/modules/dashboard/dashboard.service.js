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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const domain_entity_1 = require("../../entities/domain.entity");
const ssl_certificate_entity_1 = require("../../entities/ssl-certificate.entity");
const log_entity_1 = require("../../entities/log.entity");
const proxy_rule_entity_1 = require("../../entities/proxy-rule.entity");
let DashboardService = class DashboardService {
    constructor(domainRepository, sslCertificateRepository, logRepository, proxyRuleRepository) {
        this.domainRepository = domainRepository;
        this.sslCertificateRepository = sslCertificateRepository;
        this.logRepository = logRepository;
        this.proxyRuleRepository = proxyRuleRepository;
    }
    async getDashboardStats() {
        const [domainsTotal, domainsActive, proxyRulesTotal, proxyRulesActive, sslCertificatesTotal, sslCertificatesValid, sslCertificatesExpiring, logsTotal, logsSuccess, logsFailed,] = await Promise.all([
            this.domainRepository.count(),
            this.domainRepository.count({ where: { isActive: true } }),
            this.proxyRuleRepository.count(),
            this.proxyRuleRepository.count({ where: { isActive: true } }),
            this.sslCertificateRepository.count(),
            this.sslCertificateRepository.count({ where: { status: ssl_certificate_entity_1.CertificateStatus.VALID } }),
            this.sslCertificateRepository.count({
                where: {
                    status: ssl_certificate_entity_1.CertificateStatus.VALID,
                    expiresAt: (0, typeorm_2.LessThan)(new Date(Date.now() + (30 * 24 * 60 * 60 * 1000))),
                },
            }),
            this.logRepository.count(),
            this.logRepository.count({ where: { status: log_entity_1.LogStatus.SUCCESS } }),
            this.logRepository.count({ where: { status: log_entity_1.LogStatus.FAILED } }),
        ]);
        return {
            domains: {
                total: domainsTotal,
                active: domainsActive,
                inactive: domainsTotal - domainsActive,
            },
            proxyRules: {
                total: proxyRulesTotal,
                active: proxyRulesActive,
                inactive: proxyRulesTotal - proxyRulesActive,
            },
            sslCertificates: {
                total: sslCertificatesTotal,
                valid: sslCertificatesValid,
                expiring: sslCertificatesExpiring,
                expired: sslCertificatesTotal - sslCertificatesValid,
            },
            logs: {
                total: logsTotal,
                success: logsSuccess,
                failed: logsFailed,
                running: logsTotal - logsSuccess - logsFailed,
            },
            systemStatus: {
                nginx: {
                    status: 'online',
                    uptime: '99.8%',
                },
                traefik: {
                    status: 'online',
                    uptime: '99.9%',
                },
                database: {
                    status: 'online',
                    uptime: '100%',
                },
            },
        };
    }
    async getRecentLogs(limit = 5) {
        return this.logRepository.find({
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
    async getExpiringCertificates(days = 30) {
        const expirationDate = new Date(Date.now() + (days * 24 * 60 * 60 * 1000));
        return this.sslCertificateRepository.find({
            where: {
                status: ssl_certificate_entity_1.CertificateStatus.VALID,
                expiresAt: (0, typeorm_2.LessThan)(expirationDate),
            },
            relations: ['domain'],
            order: { expiresAt: 'ASC' },
        });
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(domain_entity_1.Domain)),
    __param(1, (0, typeorm_1.InjectRepository)(ssl_certificate_entity_1.SslCertificate)),
    __param(2, (0, typeorm_1.InjectRepository)(log_entity_1.Log)),
    __param(3, (0, typeorm_1.InjectRepository)(proxy_rule_entity_1.ProxyRule)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map