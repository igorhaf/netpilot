import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DockerQuota } from '../entities/docker-quota.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class DockerQuotaGuard implements CanActivate {
  constructor(
    @InjectRepository(DockerQuota)
    private quotaRepo: Repository<DockerQuota>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true; // Se não há usuário, deixa outros guards cuidarem da autenticação
    }

    const action = context.getHandler().name;

    // Rate limiting
    const rateLimitKey = `docker:rate_limit:${user.id}`;
    const currentCount = await this.cacheManager.get<number>(rateLimitKey) || 0;

    // Buscar quota do usuário (ou usar padrão)
    let quota = await this.quotaRepo.findOne({
      where: { user: { id: user.id } },
      relations: ['user']
    });

    if (!quota) {
      // Criar quota padrão se não existir
      quota = this.quotaRepo.create({
        user: user,
        max_containers: 10,
        max_volumes: 5,
        max_networks: 3,
        max_volume_size: 5368709120, // 5GB
        max_actions_per_minute: 10,
        max_exec_timeout: 1800 // 30min
      });
      await this.quotaRepo.save(quota);
    }

    const maxActions = quota.max_actions_per_minute;

    if (currentCount >= maxActions) {
      throw new BadRequestException(`Rate limit exceeded. Maximum ${maxActions} actions per minute.`);
    }

    // Incrementar contador
    await this.cacheManager.set(rateLimitKey, currentCount + 1, 60000); // 1 minuto TTL

    // Verificar quotas específicas para criação
    if (['createContainer', 'createVolume', 'createNetwork'].includes(action)) {
      // TODO: Implementar verificação de quotas de recursos
      // Por exemplo, contar containers/volumes/networks atuais do usuário
    }

    return true;
  }
}