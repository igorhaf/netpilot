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
exports.InitialSeedService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcryptjs");
const user_entity_1 = require("../entities/user.entity");
const domain_entity_1 = require("../entities/domain.entity");
const proxy_rule_entity_1 = require("../entities/proxy-rule.entity");
const redirect_entity_1 = require("../entities/redirect.entity");
const ssl_certificate_entity_1 = require("../entities/ssl-certificate.entity");
const log_entity_1 = require("../entities/log.entity");
let InitialSeedService = class InitialSeedService {
    constructor(userRepository, domainRepository, proxyRuleRepository, redirectRepository, sslCertificateRepository, logRepository) {
        this.userRepository = userRepository;
        this.domainRepository = domainRepository;
        this.proxyRuleRepository = proxyRuleRepository;
        this.redirectRepository = redirectRepository;
        this.sslCertificateRepository = sslCertificateRepository;
        this.logRepository = logRepository;
    }
    async seed() {
        const existingUser = await this.userRepository.findOne({
            where: { email: 'admin@netpilot.local' },
        });
        if (!existingUser) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const adminUser = this.userRepository.create({
                email: 'admin@netpilot.local',
                password: hashedPassword,
                role: 'admin',
            });
            await this.userRepository.save(adminUser);
            console.log('✅ Admin user created: admin@netpilot.local / admin123');
        }
        const existingDomain = await this.domainRepository.findOne({
            where: { name: 'netpilot.meadadigital.com' },
        });
        if (!existingDomain) {
            const sampleDomain = this.domainRepository.create({
                name: 'netpilot.meadadigital.com',
                description: 'Domínio principal do NetPilot',
                isActive: true,
                autoTls: true,
                forceHttps: true,
                blockExternalAccess: false,
                enableWwwRedirect: true,
                bindIp: '127.0.0.1',
            });
            const savedDomain = await this.domainRepository.save(sampleDomain);
            const sampleProxyRule = this.proxyRuleRepository.create({
                sourcePath: '/api/*',
                targetUrl: 'http://backend:3001',
                priority: 1,
                isActive: true,
                maintainQueryStrings: true,
                description: 'Proxy para API backend',
                domainId: savedDomain.id,
            });
            await this.proxyRuleRepository.save(sampleProxyRule);
            const sampleRedirect = this.redirectRepository.create({
                sourcePattern: '/old-dashboard',
                targetUrl: '/dashboard',
                type: redirect_entity_1.RedirectType.PERMANENT,
                isActive: true,
                priority: 1,
                description: 'Redirect dashboard antigo',
                domainId: savedDomain.id,
            });
            await this.redirectRepository.save(sampleRedirect);
            const sampleCertificate = this.sslCertificateRepository.create({
                primaryDomain: 'netpilot.meadadigital.com',
                sanDomains: ['www.netpilot.meadadigital.com'],
                status: ssl_certificate_entity_1.CertificateStatus.VALID,
                expiresAt: new Date(Date.now() + (85 * 24 * 60 * 60 * 1000)),
                autoRenew: true,
                renewBeforeDays: 30,
                issuer: "Let's Encrypt",
                domainId: savedDomain.id,
            });
            await this.sslCertificateRepository.save(sampleCertificate);
            console.log('✅ Sample domain and configurations created');
        }
        const logCount = await this.logRepository.count();
        if (logCount === 0) {
            const sampleLogs = [
                {
                    type: log_entity_1.LogType.DEPLOYMENT,
                    status: log_entity_1.LogStatus.SUCCESS,
                    action: 'Deploy do Nginx',
                    message: 'Configuração do Nginx aplicada com sucesso',
                    duration: 2500,
                    startedAt: new Date(Date.now() - 3600000),
                    completedAt: new Date(Date.now() - 3597500),
                },
                {
                    type: log_entity_1.LogType.SSL_RENEWAL,
                    status: log_entity_1.LogStatus.SUCCESS,
                    action: 'Renovação SSL netpilot.meadadigital.com',
                    message: 'Certificado SSL renovado com sucesso',
                    duration: 15000,
                    startedAt: new Date(Date.now() - 7200000),
                    completedAt: new Date(Date.now() - 7185000),
                },
                {
                    type: log_entity_1.LogType.TRAEFIK_RELOAD,
                    status: log_entity_1.LogStatus.SUCCESS,
                    action: 'Reload do Traefik',
                    message: 'Configuração do Traefik recarregada',
                    duration: 1200,
                    startedAt: new Date(Date.now() - 1800000),
                    completedAt: new Date(Date.now() - 1798800),
                },
            ];
            for (const logData of sampleLogs) {
                const log = this.logRepository.create(logData);
                await this.logRepository.save(log);
            }
            console.log('✅ Sample logs created');
        }
        console.log('🌱 Database seeding completed');
    }
};
exports.InitialSeedService = InitialSeedService;
exports.InitialSeedService = InitialSeedService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(domain_entity_1.Domain)),
    __param(2, (0, typeorm_1.InjectRepository)(proxy_rule_entity_1.ProxyRule)),
    __param(3, (0, typeorm_1.InjectRepository)(redirect_entity_1.Redirect)),
    __param(4, (0, typeorm_1.InjectRepository)(ssl_certificate_entity_1.SslCertificate)),
    __param(5, (0, typeorm_1.InjectRepository)(log_entity_1.Log)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], InitialSeedService);
//# sourceMappingURL=initial-seed.js.map