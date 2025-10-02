import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Domain } from '../../entities/domain.entity';
import { CreateDomainDto, UpdateDomainDto } from '../../dtos/domain.dto';
import { ConfigGenerationService } from '../../services/config-generation.service';
import { LogsService } from '../logs/logs.service';
import { LogType, LogStatus } from '../../entities/log.entity';

@Injectable()
export class DomainsService {
  constructor(
    @InjectRepository(Domain)
    private domainRepository: Repository<Domain>,
    private configGenerationService: ConfigGenerationService,
    private logsService: LogsService,
  ) {}

  async create(createDomainDto: CreateDomainDto): Promise<Domain> {
    const log = await this.logsService.createLog(
      LogType.DOMAIN,
      'Criar domínio',
      `Criando domínio ${createDomainDto.name}`,
    );

    try {
      const existingDomain = await this.domainRepository.findOne({
        where: { name: createDomainDto.name },
      });

      if (existingDomain) {
        await this.logsService.updateLogStatus(
          log.id,
          LogStatus.FAILED,
          `Domínio ${createDomainDto.name} já existe`,
        );
        throw new ConflictException('Domínio já existe');
      }

      const domain = this.domainRepository.create(createDomainDto);
      const savedDomain = await this.domainRepository.save(domain);

      await this.configGenerationService.generateNginxConfig();
      await this.configGenerationService.generateTraefikConfig();

      await this.logsService.updateLogStatus(
        log.id,
        LogStatus.SUCCESS,
        `Domínio ${savedDomain.name} criado com sucesso`,
        JSON.stringify({ id: savedDomain.id, name: savedDomain.name }),
      );

      return savedDomain;
    } catch (error) {
      await this.logsService.updateLogStatus(
        log.id,
        LogStatus.FAILED,
        error.message || 'Erro ao criar domínio',
        error.stack,
      );
      throw error;
    }
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
    const log = await this.logsService.createLog(
      LogType.DOMAIN,
      'Atualizar domínio',
      `Atualizando domínio ${id}`,
    );

    try {
      const domain = await this.findOne(id);

      if (updateDomainDto.name && updateDomainDto.name !== domain.name) {
        const existingDomain = await this.domainRepository.findOne({
          where: { name: updateDomainDto.name },
        });

        if (existingDomain) {
          await this.logsService.updateLogStatus(
            log.id,
            LogStatus.FAILED,
            'Nome do domínio já está em uso',
          );
          throw new ConflictException('Nome do domínio já está em uso');
        }
      }

      Object.assign(domain, updateDomainDto);
      const updatedDomain = await this.domainRepository.save(domain);

      await this.configGenerationService.generateNginxConfig();
      await this.configGenerationService.generateTraefikConfig();

      await this.logsService.updateLogStatus(
        log.id,
        LogStatus.SUCCESS,
        `Domínio ${updatedDomain.name} atualizado com sucesso`,
        JSON.stringify({ id: updatedDomain.id, changes: updateDomainDto }),
      );

      return updatedDomain;
    } catch (error) {
      await this.logsService.updateLogStatus(
        log.id,
        LogStatus.FAILED,
        error.message || 'Erro ao atualizar domínio',
        error.stack,
      );
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const log = await this.logsService.createLog(
      LogType.DOMAIN,
      'Remover domínio',
      `Removendo domínio ${id}`,
    );

    try {
      const domain = await this.findOne(id);
      const domainName = domain.name;

      await this.domainRepository.remove(domain);

      await this.configGenerationService.generateNginxConfig();
      await this.configGenerationService.generateTraefikConfig();

      await this.logsService.updateLogStatus(
        log.id,
        LogStatus.SUCCESS,
        `Domínio ${domainName} removido com sucesso`,
      );
    } catch (error) {
      await this.logsService.updateLogStatus(
        log.id,
        LogStatus.FAILED,
        error.message || 'Erro ao remover domínio',
        error.stack,
      );
      throw error;
    }
  }

  async toggleLock(id: string): Promise<Domain> {
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
}