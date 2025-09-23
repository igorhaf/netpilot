import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProxyRule } from '../../entities/proxy-rule.entity';
import { CreateProxyRuleDto, UpdateProxyRuleDto } from '../../dtos/proxy-rule.dto';
import { ConfigGenerationService } from '../../services/config-generation.service';

@Injectable()
export class ProxyRulesService {
  constructor(
    @InjectRepository(ProxyRule)
    private proxyRuleRepository: Repository<ProxyRule>,
    private configGenerationService: ConfigGenerationService,
  ) {}

  async create(createProxyRuleDto: CreateProxyRuleDto): Promise<ProxyRule> {
    const proxyRule = this.proxyRuleRepository.create(createProxyRuleDto);
    const saved = await this.proxyRuleRepository.save(proxyRule);

    await this.configGenerationService.generateNginxConfig();
    await this.configGenerationService.generateTraefikConfig();

    return this.findOne(saved.id);
  }

  async findAll(search?: string, status?: string): Promise<ProxyRule[]> {
    const query = this.proxyRuleRepository.createQueryBuilder('proxyRule')
      .leftJoinAndSelect('proxyRule.domain', 'domain');

    if (search) {
      query.where(
        'proxyRule.sourcePath ILIKE :search OR proxyRule.targetUrl ILIKE :search OR domain.name ILIKE :search',
        { search: `%${search}%` }
      );
    }

    if (status) {
      query.andWhere('proxyRule.isActive = :isActive', {
        isActive: status === 'active',
      });
    }

    return query.orderBy('proxyRule.priority', 'DESC')
      .addOrderBy('proxyRule.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<ProxyRule> {
    const proxyRule = await this.proxyRuleRepository.findOne({
      where: { id },
      relations: ['domain'],
    });

    if (!proxyRule) {
      throw new NotFoundException('Regra de proxy não encontrada');
    }

    return proxyRule;
  }

  async update(id: string, updateProxyRuleDto: UpdateProxyRuleDto): Promise<ProxyRule> {
    const proxyRule = await this.findOne(id);

    // Verifica se a regra está travada e não está sendo apenas destravada
    if (proxyRule.isLocked && !updateProxyRuleDto.hasOwnProperty('isLocked')) {
      throw new BadRequestException('Esta regra de proxy está travada e não pode ser editada. Destravar primeiro.');
    }

    Object.assign(proxyRule, updateProxyRuleDto);
    await this.proxyRuleRepository.save(proxyRule);

    await this.configGenerationService.generateNginxConfig();
    await this.configGenerationService.generateTraefikConfig();

    return this.findOne(id);
  }

  async toggleLock(id: string): Promise<ProxyRule> {
    const proxyRule = await this.findOne(id);
    proxyRule.isLocked = !proxyRule.isLocked;
    await this.proxyRuleRepository.save(proxyRule);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const proxyRule = await this.findOne(id);

    // Verifica se a regra está travada
    if (proxyRule.isLocked) {
      throw new BadRequestException('Esta regra de proxy está travada e não pode ser excluída. Destravar primeiro.');
    }

    await this.proxyRuleRepository.remove(proxyRule);

    await this.configGenerationService.generateNginxConfig();
    await this.configGenerationService.generateTraefikConfig();
  }

  async applyConfiguration(): Promise<{ success: boolean; message: string }> {
    try {
      await this.configGenerationService.generateNginxConfig();
      await this.configGenerationService.generateTraefikConfig();
      return {
        success: true,
        message: 'Configuração aplicada com sucesso',
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro ao aplicar configuração: ${error.message}`,
      };
    }
  }
}