import { Repository } from 'typeorm';
import { Domain } from '../../entities/domain.entity';
import { CreateDomainDto, UpdateDomainDto } from '../../dtos/domain.dto';
import { ConfigGenerationService } from '../../services/config-generation.service';
export declare class DomainsService {
    private domainRepository;
    private configGenerationService;
    constructor(domainRepository: Repository<Domain>, configGenerationService: ConfigGenerationService);
    create(createDomainDto: CreateDomainDto): Promise<Domain>;
    findAll(search?: string, status?: string, autoTls?: string): Promise<Domain[]>;
    findOne(id: string): Promise<Domain>;
    update(id: string, updateDomainDto: UpdateDomainDto): Promise<Domain>;
    remove(id: string): Promise<void>;
    getStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        withSsl: number;
        withoutSsl: number;
    }>;
}
