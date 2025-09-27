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
exports.DomainsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const domain_entity_1 = require("../../entities/domain.entity");
const config_generation_service_1 = require("../../services/config-generation.service");
let DomainsService = class DomainsService {
    constructor(domainRepository, configGenerationService) {
        this.domainRepository = domainRepository;
        this.configGenerationService = configGenerationService;
    }
    async create(createDomainDto) {
        const existingDomain = await this.domainRepository.findOne({
            where: { name: createDomainDto.name },
        });
        if (existingDomain) {
            throw new common_1.ConflictException('Domínio já existe');
        }
        const domain = this.domainRepository.create(createDomainDto);
        const savedDomain = await this.domainRepository.save(domain);
        await this.configGenerationService.generateNginxConfig();
        await this.configGenerationService.generateTraefikConfig();
        return savedDomain;
    }
    async findAll(search, status, autoTls) {
        const query = this.domainRepository.createQueryBuilder('domain')
            .leftJoinAndSelect('domain.proxyRules', 'proxyRules')
            .leftJoinAndSelect('domain.sslCertificates', 'sslCertificates');
        if (search) {
            query.where('domain.name ILIKE :search OR domain.description ILIKE :search', {
                search: `%${search}%`,
            });
        }
        if (status) {
            query.andWhere('domain.isActive = :isActive', {
                isActive: status === 'active',
            });
        }
        if (autoTls) {
            query.andWhere('domain.autoTls = :autoTls', {
                autoTls: autoTls === 'true',
            });
        }
        return query.orderBy('domain.createdAt', 'DESC').getMany();
    }
    async findOne(id) {
        const domain = await this.domainRepository.findOne({
            where: { id },
            relations: ['proxyRules', 'sslCertificates'],
        });
        if (!domain) {
            throw new common_1.NotFoundException('Domínio não encontrado');
        }
        return domain;
    }
    async update(id, updateDomainDto) {
        const domain = await this.findOne(id);
        if (updateDomainDto.name && updateDomainDto.name !== domain.name) {
            const existingDomain = await this.domainRepository.findOne({
                where: { name: updateDomainDto.name },
            });
            if (existingDomain) {
                throw new common_1.ConflictException('Nome do domínio já está em uso');
            }
        }
        Object.assign(domain, updateDomainDto);
        const updatedDomain = await this.domainRepository.save(domain);
        await this.configGenerationService.generateNginxConfig();
        await this.configGenerationService.generateTraefikConfig();
        return updatedDomain;
    }
    async remove(id) {
        const domain = await this.findOne(id);
        await this.domainRepository.remove(domain);
        await this.configGenerationService.generateNginxConfig();
        await this.configGenerationService.generateTraefikConfig();
    }
    async toggleLock(id) {
        const domain = await this.findOne(id);
        domain.isLocked = !domain.isLocked;
        await this.domainRepository.save(domain);
        return this.findOne(id);
    }
    async getStats() {
        const [total, active, withSsl] = await Promise.all([
            this.domainRepository.count(),
            this.domainRepository.count({ where: { isActive: true } }),
            this.domainRepository.count({ where: { autoTls: true } }),
        ]);
        return {
            total,
            active,
            inactive: total - active,
            withSsl,
            withoutSsl: total - withSsl,
        };
    }
};
exports.DomainsService = DomainsService;
exports.DomainsService = DomainsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(domain_entity_1.Domain)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_generation_service_1.ConfigGenerationService])
], DomainsService);
//# sourceMappingURL=domains.service.js.map