import { Repository } from 'typeorm';
import { Domain } from '../entities/domain.entity';
import { ConfigService } from './config.service';
export declare class ConfigGenerationService {
    private domainRepository;
    private configService;
    constructor(domainRepository: Repository<Domain>, configService: ConfigService);
    generateNginxConfig(): Promise<void>;
    private generateNginxVirtualHost;
    generateTraefikConfig(): Promise<void>;
    private addTraefikDomainConfig;
    private yamlStringify;
    private reloadNginx;
}
