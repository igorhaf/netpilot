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
var SslCertificatesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SslCertificatesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
const ssl_certificate_entity_1 = require("../../entities/ssl-certificate.entity");
let SslCertificatesService = SslCertificatesService_1 = class SslCertificatesService {
    constructor(sslCertificateRepository, httpService, configService) {
        this.sslCertificateRepository = sslCertificateRepository;
        this.httpService = httpService;
        this.configService = configService;
        this.logger = new common_1.Logger(SslCertificatesService_1.name);
        this.systemOpsUrl = this.configService.get('SYSTEM_OPS_URL', 'http://localhost:8001');
    }
    async create(createSslCertificateDto) {
        const domain = await this.findDomainById(createSslCertificateDto.domainId);
        if (!domain) {
            throw new common_1.NotFoundException('Domínio não encontrado');
        }
        const existingCert = await this.sslCertificateRepository.findOne({
            where: { primaryDomain: createSslCertificateDto.primaryDomain }
        });
        if (existingCert) {
            throw new common_1.BadRequestException('Já existe um certificado para este domínio');
        }
        this.validateDomainName(createSslCertificateDto.primaryDomain);
        if (createSslCertificateDto.sanDomains?.length > 0) {
            createSslCertificateDto.sanDomains.forEach(domain => {
                this.validateDomainName(domain);
            });
        }
        try {
            this.logger.log(`📝 Solicitando emissão de certificado SSL ao Python service para ${createSslCertificateDto.primaryDomain}`);
            const allDomains = [createSslCertificateDto.primaryDomain];
            if (createSslCertificateDto.sanDomains?.length > 0) {
                allDomains.push(...createSslCertificateDto.sanDomains);
            }
            const sslRequest = {
                domains: allDomains,
                provider: 'letsencrypt',
                email: process.env.SSL_EMAIL || 'admin@netpilot.local',
                agree_tos: true,
                staging: process.env.ACME_STAGING === 'true',
                challenge_type: 'http-01',
                webroot_path: process.env.ACME_CHALLENGE_PATH || '/var/www/certbot'
            };
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.systemOpsUrl}/ssl/issue`, sslRequest, {
                timeout: 120000
            }));
            if (response.data.success) {
                this.logger.log(`✅ Certificado SSL emitido com sucesso para ${createSslCertificateDto.primaryDomain}`);
                const certificate = await this.sslCertificateRepository.findOne({
                    where: { id: response.data.certificate_id }
                });
                if (certificate) {
                    return certificate;
                }
            }
            throw new Error(response.data.message || 'Erro ao emitir certificado');
        }
        catch (error) {
            this.logger.error(`❌ Erro ao comunicar com Python service: ${error.message}`);
            throw new common_1.BadRequestException(`Erro ao emitir certificado: ${error.message}`);
        }
    }
    async findDomainById(domainId) {
        return { id: domainId, name: 'example.com' };
    }
    validateDomainName(domain) {
        if (!domain || typeof domain !== 'string') {
            throw new common_1.BadRequestException('Nome do domínio é obrigatório');
        }
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!domainRegex.test(domain)) {
            throw new common_1.BadRequestException(`Formato de domínio inválido: ${domain}`);
        }
        if (domain.length > 253) {
            throw new common_1.BadRequestException('Nome do domínio muito longo');
        }
        if (domain.includes('..')) {
            throw new common_1.BadRequestException('Domínio não pode conter pontos consecutivos');
        }
    }
    async findAll() {
        return this.sslCertificateRepository.find({
            relations: ['domain'],
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id) {
        const certificate = await this.sslCertificateRepository.findOne({
            where: { id },
            relations: ['domain'],
        });
        if (!certificate) {
            throw new common_1.NotFoundException('Certificado SSL não encontrado');
        }
        return certificate;
    }
    async update(id, updateSslCertificateDto) {
        const certificate = await this.findOne(id);
        if (certificate.isLocked) {
            throw new common_1.BadRequestException('Não é possível atualizar um certificado travado');
        }
        Object.assign(certificate, updateSslCertificateDto);
        return await this.sslCertificateRepository.save(certificate);
    }
    async remove(id) {
        const certificate = await this.findOne(id);
        if (certificate.isLocked) {
            throw new common_1.BadRequestException('Não é possível remover um certificado travado');
        }
        await this.deleteCertificateFiles(certificate);
        await this.sslCertificateRepository.remove(certificate);
    }
    async toggleLock(id) {
        const certificate = await this.findOne(id);
        certificate.isLocked = !certificate.isLocked;
        await this.sslCertificateRepository.save(certificate);
        return this.findOne(id);
    }
    async getStats() {
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
        const [total, valid, expiring, expired] = await Promise.all([
            this.sslCertificateRepository.count(),
            this.sslCertificateRepository.count({
                where: { status: ssl_certificate_entity_1.CertificateStatus.VALID }
            }),
            this.sslCertificateRepository.count({
                where: {
                    status: ssl_certificate_entity_1.CertificateStatus.VALID,
                    expiresAt: (0, typeorm_2.LessThan)(thirtyDaysFromNow),
                },
            }),
            this.sslCertificateRepository.count({
                where: { status: ssl_certificate_entity_1.CertificateStatus.EXPIRED }
            }),
        ]);
        return {
            total,
            valid,
            expiring,
            expired,
        };
    }
    async renewCertificate(id) {
        const certificate = await this.findOne(id);
        if (certificate.isLocked) {
            throw new common_1.BadRequestException('Não é possível renovar um certificado travado');
        }
        try {
            this.logger.log(`🔄 Solicitando renovação de certificado SSL ao Python service para ${certificate.primaryDomain}`);
            certificate.status = ssl_certificate_entity_1.CertificateStatus.PENDING;
            await this.sslCertificateRepository.save(certificate);
            const renewalRequest = {
                certificate_id: id,
                domains: [certificate.primaryDomain, ...(certificate.sanDomains || [])],
                force: false,
                days_before_expiry: 30
            };
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.systemOpsUrl}/ssl/renew`, renewalRequest, {
                timeout: 120000
            }));
            if (response.data.success) {
                this.logger.log(`✅ Certificado SSL renovado com sucesso para ${certificate.primaryDomain}`);
                return {
                    success: true,
                    message: 'Certificado renovado com sucesso',
                };
            }
            else {
                throw new Error(response.data.message || 'Erro ao renovar certificado');
            }
        }
        catch (error) {
            this.logger.error(`❌ Erro ao renovar certificado: ${error.message}`);
            certificate.status = ssl_certificate_entity_1.CertificateStatus.FAILED;
            certificate.lastError = error.message;
            await this.sslCertificateRepository.save(certificate);
            return {
                success: false,
                message: `Erro na renovação: ${error.message}`,
            };
        }
    }
    async deleteCertificateFiles(certificate) {
        this.logger.log(`Marcando certificado como deletado: ${certificate.primaryDomain}`);
    }
    async renewExpiredCertificates() {
        const expiredCertificates = await this.sslCertificateRepository.find({
            where: [
                { status: ssl_certificate_entity_1.CertificateStatus.EXPIRED },
                { status: ssl_certificate_entity_1.CertificateStatus.EXPIRING },
            ],
        });
        let renewed = 0;
        let failed = 0;
        for (const cert of expiredCertificates) {
            const result = await this.renewCertificate(cert.id);
            if (result.success) {
                renewed++;
            }
            else {
                failed++;
            }
        }
        return {
            success: true,
            renewed,
            failed,
        };
    }
};
exports.SslCertificatesService = SslCertificatesService;
exports.SslCertificatesService = SslCertificatesService = SslCertificatesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(ssl_certificate_entity_1.SslCertificate)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        axios_1.HttpService,
        config_1.ConfigService])
], SslCertificatesService);
//# sourceMappingURL=ssl-certificates.service.js.map