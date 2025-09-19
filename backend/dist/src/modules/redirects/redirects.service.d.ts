import { Repository } from 'typeorm';
import { Redirect } from '../../entities/redirect.entity';
import { CreateRedirectDto, UpdateRedirectDto } from '../../dtos/redirect.dto';
import { ConfigGenerationService } from '../../services/config-generation.service';
export declare class RedirectsService {
    private redirectRepository;
    private configGenerationService;
    constructor(redirectRepository: Repository<Redirect>, configGenerationService: ConfigGenerationService);
    create(createRedirectDto: CreateRedirectDto): Promise<Redirect>;
    findAll(search?: string, type?: string, status?: string): Promise<Redirect[]>;
    findOne(id: string): Promise<Redirect>;
    update(id: string, updateRedirectDto: UpdateRedirectDto): Promise<Redirect>;
    remove(id: string): Promise<void>;
}
