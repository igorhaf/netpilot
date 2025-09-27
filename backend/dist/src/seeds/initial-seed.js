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
const project_entity_1 = require("../entities/project.entity");
const domain_entity_1 = require("../entities/domain.entity");
const proxy_rule_entity_1 = require("../entities/proxy-rule.entity");
const redirect_entity_1 = require("../entities/redirect.entity");
const ssl_certificate_entity_1 = require("../entities/ssl-certificate.entity");
const log_entity_1 = require("../entities/log.entity");
let InitialSeedService = class InitialSeedService {
    constructor(userRepository, projectRepository, domainRepository, proxyRuleRepository, redirectRepository, sslCertificateRepository, logRepository) {
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.domainRepository = domainRepository;
        this.proxyRuleRepository = proxyRuleRepository;
        this.redirectRepository = redirectRepository;
        this.sslCertificateRepository = sslCertificateRepository;
        this.logRepository = logRepository;
    }
    async seed() {
        console.log('🌱 Iniciando seeding do banco de dados...');
        const existingUser = await this.userRepository.findOne({
            where: { email: 'admin@netpilot.local' },
        });
        if (!existingUser) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const adminUser = this.userRepository.create({
                email: 'admin@netpilot.local',
                password: hashedPassword,
                role: 'admin',
                isActive: true,
            });
            await this.userRepository.save(adminUser);
            console.log('✅ Admin user created: admin@netpilot.local / admin123');
        }
        else {
            console.log('ℹ️  Admin user already exists');
        }
        const existingProject = await this.projectRepository.findOne({
            where: { name: 'NetPilot System' },
        });
        let savedProject;
        if (!existingProject) {
            const sampleProject = this.projectRepository.create({
                name: 'NetPilot System',
                alias: 'netpilot-system',
                description: 'Sistema principal NetPilot para gerenciamento de proxy reverso e SSL',
                isActive: true,
                technologies: ['NestJS', 'Next.js', 'TypeScript', 'Docker', 'PostgreSQL', 'Traefik', 'Nginx'],
                repository: 'https://github.com/netpilot/netpilot',
                documentation: 'https://docs.netpilot.com',
                mainDomain: 'netpilot.meadadigital.com',
                metadata: {
                    version: '1.0.0',
                    environment: 'production'
                }
            });
            savedProject = await this.projectRepository.save(sampleProject);
            console.log('✅ Sample project created');
        }
        else {
            savedProject = existingProject;
            console.log('ℹ️  Sample project already exists');
        }
        const existingDeitProject = await this.projectRepository.findOne({
            where: { name: 'Deit' },
        });
        let savedDeitProject;
        if (!existingDeitProject) {
            const deitProject = this.projectRepository.create({
                name: 'Deit',
                alias: 'deit',
                description: 'Sistema Deit - Plataforma de gestão e automação empresarial',
                isActive: true,
                technologies: ['Laravel', 'Vue.js', 'PHP', 'MySQL', 'Docker', 'Redis'],
                repository: 'https://github.com/meadadigital/deit',
                documentation: 'https://docs.deit.meadadigital.com',
                mainDomain: 'deit.meadadigital.com',
                metadata: {
                    version: '2.1.0',
                    environment: 'production',
                    type: 'business-platform'
                }
            });
            savedDeitProject = await this.projectRepository.save(deitProject);
            console.log('✅ Deit project created');
        }
        else {
            savedDeitProject = existingDeitProject;
            console.log('ℹ️  Deit project already exists');
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
                projectId: savedProject.id,
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
        else {
            console.log('ℹ️  Sample domain already exists');
        }
        const existingDeitDomain = await this.domainRepository.findOne({
            where: { name: 'deit.meadadigital.com' },
        });
        if (!existingDeitDomain) {
            const deitDomain = this.domainRepository.create({
                name: 'deit.meadadigital.com',
                description: 'Domínio principal do sistema Deit',
                isActive: true,
                autoTls: true,
                forceHttps: true,
                blockExternalAccess: false,
                enableWwwRedirect: true,
                bindIp: '127.0.0.1',
                projectId: savedDeitProject.id,
            });
            await this.domainRepository.save(deitDomain);
            console.log('✅ Deit domain created');
        }
        else {
            console.log('ℹ️  Deit domain already exists');
        }
        console.log('ℹ️  Sample logs creation disabled - showing only real logs');
        console.log('🌱 Database seeding completed successfully!');
    }
};
exports.InitialSeedService = InitialSeedService;
exports.InitialSeedService = InitialSeedService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(2, (0, typeorm_1.InjectRepository)(domain_entity_1.Domain)),
    __param(3, (0, typeorm_1.InjectRepository)(proxy_rule_entity_1.ProxyRule)),
    __param(4, (0, typeorm_1.InjectRepository)(redirect_entity_1.Redirect)),
    __param(5, (0, typeorm_1.InjectRepository)(ssl_certificate_entity_1.SslCertificate)),
    __param(6, (0, typeorm_1.InjectRepository)(log_entity_1.Log)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], InitialSeedService);
//# sourceMappingURL=initial-seed.js.map