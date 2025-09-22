import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DockerQuota } from '../entities/docker-quota.entity';
import { Cache } from 'cache-manager';
export declare class DockerQuotaGuard implements CanActivate {
    private quotaRepo;
    private cacheManager;
    constructor(quotaRepo: Repository<DockerQuota>, cacheManager: Cache);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
