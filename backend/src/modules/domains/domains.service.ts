import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Domain } from '../../entities/domain.entity';
import { CreateDomainDto, UpdateDomainDto } from '../../dtos/domain.dto';
import { ConfigGenerationService } from '../../services/config-generation.service';

@Injectable()
export class DomainsService {
  constructor(
    @InjectRepository(Domain)
    private domainRepository: Repository<Domain>,
    private configGenerationService: ConfigGenerationService,
  ) {}

  async create(createDomainDto: CreateDomainDto): Promise<Domain> {
    const existingDomain = await this.domainRepository.findOne({
      where: { name: createDomainDto.name },
    });

    if (existingDomain) {
      throw new ConflictException('Domínio já existe');
    }

    const domain = this.domainRepository.create(createDomainDto);
    const savedDomain = await this.domainRepository.save(domain);

    await this.configGenerationService.generateNginxConfig();
    await this.configGenerationService.generateTraefikConfig();

    return savedDomain;
  }

  async findAll(search?: string, status?: string, autoTls?: string): Promise<Domain[]> {
    const query = this.domainRepository.createQueryBuilder('domain')
      .leftJoinAndSelect('domain.proxyRules', 'proxyRules')
      // .leftJoinAndSelect('domain.redirects', 'redirects') // Temporarily disabled
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

  async findOne(id: string): Promise<Domain> {
    const domain = await this.domainRepository.findOne({
      where: { id },
      relations: ['proxyRules', 'sslCertificates'], // 'redirects' temporarily disabled
    });

    if (!domain) {
      throw new NotFoundException('Domínio não encontrado');
    }

    return domain;
  }

  async update(id: string, updateDomainDto: UpdateDomainDto): Promise<Domain> {
    const domain = await this.findOne(id);

    if (updateDomainDto.name && updateDomainDto.name !== domain.name) {
      const existingDomain = await this.domainRepository.findOne({
        where: { name: updateDomainDto.name },
      });

      if (existingDomain) {
        throw new ConflictException('Nome do domínio já está em uso');
      }
    }

    Object.assign(domain, updateDomainDto);
    const updatedDomain = await this.domainRepository.save(domain);

    await this.configGenerationService.generateNginxConfig();
    await this.configGenerationService.generateTraefikConfig();

    return updatedDomain;
  }

  async remove(id: string): Promise<void> {
    const domain = await this.findOne(id);
    await this.domainRepository.remove(domain);

    await this.configGenerationService.generateNginxConfig();
    await this.configGenerationService.generateTraefikConfig();
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
}