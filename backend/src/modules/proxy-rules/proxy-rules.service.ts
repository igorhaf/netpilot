import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProxyRule } from '../../entities/proxy-rule.entity';
import { CreateProxyRuleDto, UpdateProxyRuleDto } from '../../dtos/proxy-rule.dto';
import { ConfigGenerationService } from '../../services/config-generation.service';
import { LogsService } from '../logs/logs.service';
import { LogType, LogStatus } from '../../entities/log.entity';

@Injectable()
export class ProxyRulesService {
  constructor(
    @InjectRepository(ProxyRule)
    private proxyRuleRepository: Repository<ProxyRule>,
    private configGenerationService: ConfigGenerationService,
    private logsService: LogsService,
  ) {}

  async create(createProxyRuleDto: CreateProxyRuleDto): Promise<ProxyRule> {
    const log = await this.logsService.createLog(
      LogType.PROXY_RULE,
      'Criar regra de proxy',
      `Criando regra de proxy para ${createProxyRuleDto.sourcePath}`,
    );

    try {
      const proxyRule = this.proxyRuleRepository.create(createProxyRuleDto);
      const saved = await this.proxyRuleRepository.save(proxyRule);

      await this.configGenerationService.generateNginxConfig();
      await this.configGenerationService.generateTraefikConfig();

      await this.logsService.updateLogStatus(
        log.id,
        LogStatus.SUCCESS,
        `Regra de proxy criada: ${saved.sourcePath} → ${saved.targetUrl}`,
        JSON.stringify({ id: saved.id, sourcePath: saved.sourcePath }),
      );

      return this.findOne(saved.id);
    } catch (error) {
      await this.logsService.updateLogStatus(
        log.id,
        LogStatus.FAILED,
        error.message || 'Erro ao criar regra de proxy',
        error.stack,
      );
      throw error;
    }
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
    const log = await this.logsService.createLog(
      LogType.PROXY_RULE,
      'Atualizar regra de proxy',
      `Atualizando regra de proxy ${id}`,
    );

    try {
      const proxyRule = await this.findOne(id);

      // Verifica se a regra está travada e não está sendo apenas destravada
      if (proxyRule.isLocked && !updateProxyRuleDto.hasOwnProperty('isLocked')) {
        await this.logsService.updateLogStatus(
          log.id,
          LogStatus.FAILED,
          'Regra de proxy está travada',
        );
        throw new BadRequestException('Esta regra de proxy está travada e não pode ser editada. Destravar primeiro.');
      }

      Object.assign(proxyRule, updateProxyRuleDto);
      await this.proxyRuleRepository.save(proxyRule);

      await this.configGenerationService.generateNginxConfig();
      await this.configGenerationService.generateTraefikConfig();

      await this.logsService.updateLogStatus(
        log.id,
        LogStatus.SUCCESS,
        `Regra de proxy atualizada: ${proxyRule.sourcePath}`,
        JSON.stringify({ id: proxyRule.id, changes: updateProxyRuleDto }),
      );

      return this.findOne(id);
    } catch (error) {
      await this.logsService.updateLogStatus(
        log.id,
        LogStatus.FAILED,
        error.message || 'Erro ao atualizar regra de proxy',
        error.stack,
      );
      throw error;
    }
  }

  async toggleLock(id: string): Promise<ProxyRule> {
    const proxyRule = await this.findOne(id);
    proxyRule.isLocked = !proxyRule.isLocked;
    await this.proxyRuleRepository.save(proxyRule);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const log = await this.logsService.createLog(
      LogType.PROXY_RULE,
      'Remover regra de proxy',
      `Removendo regra de proxy ${id}`,
    );

    try {
      const proxyRule = await this.findOne(id);
      const sourcePath = proxyRule.sourcePath;

      // Verifica se a regra está travada
      if (proxyRule.isLocked) {
        await this.logsService.updateLogStatus(
          log.id,
          LogStatus.FAILED,
          'Regra de proxy está travada',
        );
        throw new BadRequestException('Esta regra de proxy está travada e não pode ser excluída. Destravar primeiro.');
      }

      await this.proxyRuleRepository.remove(proxyRule);

      await this.configGenerationService.generateNginxConfig();
      await this.configGenerationService.generateTraefikConfig();

      await this.logsService.updateLogStatus(
        log.id,
        LogStatus.SUCCESS,
        `Regra de proxy removida: ${sourcePath}`,
      );
    } catch (error) {
      await this.logsService.updateLogStatus(
        log.id,
        LogStatus.FAILED,
        error.message || 'Erro ao remover regra de proxy',
        error.stack,
      );
      throw error;
    }
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