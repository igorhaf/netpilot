import { Repository } from 'typeorm';
import { ProxyRule } from '../../entities/proxy-rule.entity';
import { CreateProxyRuleDto, UpdateProxyRuleDto } from '../../dtos/proxy-rule.dto';
import { ConfigGenerationService } from '../../services/config-generation.service';
import { LogsService } from '../logs/logs.service';
export declare class ProxyRulesService {
    private proxyRuleRepository;
    private configGenerationService;
    private logsService;
    constructor(proxyRuleRepository: Repository<ProxyRule>, configGenerationService: ConfigGenerationService, logsService: LogsService);
    create(createProxyRuleDto: CreateProxyRuleDto): Promise<ProxyRule>;
    findAll(search?: string, status?: string): Promise<ProxyRule[]>;
    findOne(id: string): Promise<ProxyRule>;
    update(id: string, updateProxyRuleDto: UpdateProxyRuleDto): Promise<ProxyRule>;
    toggleLock(id: string): Promise<ProxyRule>;
    remove(id: string): Promise<void>;
    applyConfiguration(): Promise<{
        success: boolean;
        message: string;
    }>;
}
