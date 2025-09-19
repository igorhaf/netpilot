import { RedirectsService } from './redirects.service';
import { CreateRedirectDto, UpdateRedirectDto } from '../../dtos/redirect.dto';
export declare class RedirectsController {
    private readonly redirectsService;
    constructor(redirectsService: RedirectsService);
    create(createRedirectDto: CreateRedirectDto): Promise<import("../../entities/redirect.entity").Redirect>;
    findAll(search?: string, type?: string, status?: string): Promise<import("../../entities/redirect.entity").Redirect[]>;
    findOne(id: string): Promise<import("../../entities/redirect.entity").Redirect>;
    update(id: string, updateRedirectDto: UpdateRedirectDto): Promise<import("../../entities/redirect.entity").Redirect>;
    remove(id: string): Promise<void>;
}
