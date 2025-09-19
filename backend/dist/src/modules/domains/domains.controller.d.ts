import { DomainsService } from './domains.service';
import { CreateDomainDto, UpdateDomainDto } from '../../dtos/domain.dto';
export declare class DomainsController {
    private readonly domainsService;
    constructor(domainsService: DomainsService);
    create(createDomainDto: CreateDomainDto): Promise<import("../../entities/domain.entity").Domain>;
    findAll(search?: string, status?: string, autoTls?: string): Promise<import("../../entities/domain.entity").Domain[]>;
    getStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        withSsl: number;
        withoutSsl: number;
    }>;
    findOne(id: string): Promise<import("../../entities/domain.entity").Domain>;
    update(id: string, updateDomainDto: UpdateDomainDto): Promise<import("../../entities/domain.entity").Domain>;
    remove(id: string): Promise<void>;
}
