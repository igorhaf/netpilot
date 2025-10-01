import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { Domain } from '../entities/domain.entity';
import { ConfigService } from './config.service';
export declare class ConfigGenerationService {
    private domainRepository;
    private configService;
    private readonly httpService;
    private readonly nestConfigService;
    private readonly logger;
    private readonly systemOpsUrl;
    constructor(domainRepository: Repository<Domain>, configService: ConfigService, httpService: HttpService, nestConfigService: NestConfigService);
    generateNginxConfig(): Promise<void>;
    private generateNginxVirtualHost;
    generateTraefikConfig(): Promise<void>;
    private addTraefikDomainConfig;
    private addNetpilotDomainRouting;
    private yamlStringify;
    private reloadNginx;
    private getEntryPointsForPort;
}
