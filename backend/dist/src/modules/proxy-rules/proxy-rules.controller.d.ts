import { ProxyRulesService } from './proxy-rules.service';
import { CreateProxyRuleDto, UpdateProxyRuleDto } from '../../dtos/proxy-rule.dto';
export declare class ProxyRulesController {
    private readonly proxyRulesService;
    constructor(proxyRulesService: ProxyRulesService);
    create(createProxyRuleDto: CreateProxyRuleDto): Promise<import("../../entities/proxy-rule.entity").ProxyRule>;
    findAll(search?: string, status?: string): Promise<import("../../entities/proxy-rule.entity").ProxyRule[]>;
    applyConfiguration(): Promise<{
        success: boolean;
        message: string;
    }>;
    findOne(id: string): Promise<import("../../entities/proxy-rule.entity").ProxyRule>;
    update(id: string, updateProxyRuleDto: UpdateProxyRuleDto): Promise<import("../../entities/proxy-rule.entity").ProxyRule>;
    toggleLock(id: string): Promise<import("../../entities/proxy-rule.entity").ProxyRule>;
    remove(id: string): Promise<void>;
}
