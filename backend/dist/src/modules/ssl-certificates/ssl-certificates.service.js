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
exports.SslCertificatesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ssl_certificate_entity_1 = require("../../entities/ssl-certificate.entity");
let SslCertificatesService = class SslCertificatesService {
    constructor(sslCertificateRepository) {
        this.sslCertificateRepository = sslCertificateRepository;
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
        const certificate = this.sslCertificateRepository.create(createSslCertificateDto);
        try {
            const certData = await this.issueNewCertificate(createSslCertificateDto.primaryDomain, createSslCertificateDto.sanDomains);
            certificate.certificatePath = certData.certificatePath;
            certificate.privateKeyPath = certData.privateKeyPath;
            certificate.expiresAt = certData.expiresAt;
            certificate.status = ssl_certificate_entity_1.CertificateStatus.VALID;
        }
        catch (error) {
            certificate.status = ssl_certificate_entity_1.CertificateStatus.FAILED;
            certificate.lastError = error.message;
        }
        return await this.sslCertificateRepository.save(certificate);
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
        Object.assign(certificate, updateSslCertificateDto);
        return await this.sslCertificateRepository.save(certificate);
    }
    async remove(id) {
        const certificate = await this.findOne(id);
        await this.deleteCertificateFiles(certificate);
        await this.sslCertificateRepository.remove(certificate);
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
        try {
            certificate.status = ssl_certificate_entity_1.CertificateStatus.PENDING;
            await this.sslCertificateRepository.save(certificate);
            const renewalResult = await this.renewCertificateWithAcme(certificate);
            certificate.status = ssl_certificate_entity_1.CertificateStatus.VALID;
            certificate.expiresAt = renewalResult.expiresAt;
            certificate.certificatePath = renewalResult.certificatePath;
            certificate.privateKeyPath = renewalResult.privateKeyPath;
            certificate.lastError = null;
            await this.sslCertificateRepository.save(certificate);
            return {
                success: true,
                message: 'Certificado renovado com sucesso',
            };
        }
        catch (error) {
            certificate.status = ssl_certificate_entity_1.CertificateStatus.FAILED;
            certificate.lastError = error.message;
            await this.sslCertificateRepository.save(certificate);
            return {
                success: false,
                message: `Erro na renovação: ${error.message}`,
            };
        }
    }
    async renewCertificateWithAcme(certificate) {
        const basePath = `/ssl/${certificate.primaryDomain}`;
        return {
            certificatePath: `${basePath}.crt`,
            privateKeyPath: `${basePath}.key`,
            expiresAt: new Date(Date.now() + (90 * 24 * 60 * 60 * 1000)),
        };
    }
    async issueNewCertificate(domain, sanDomains) {
        const basePath = `/ssl/${domain}`;
        return {
            certificatePath: `${basePath}.crt`,
            privateKeyPath: `${basePath}.key`,
            expiresAt: new Date(Date.now() + (90 * 24 * 60 * 60 * 1000)),
        };
    }
    async deleteCertificateFiles(certificate) {
        console.log(`Deleting certificate files for ${certificate.primaryDomain}`);
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
exports.SslCertificatesService = SslCertificatesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(ssl_certificate_entity_1.SslCertificate)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SslCertificatesService);
//# sourceMappingURL=ssl-certificates.service.js.map