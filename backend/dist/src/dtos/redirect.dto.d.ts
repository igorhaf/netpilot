import { RedirectType } from '../entities/redirect.entity';
export declare class CreateRedirectDto {
    sourcePattern: string;
    targetUrl: string;
    type: RedirectType;
    isActive?: boolean;
    priority?: number;
    description?: string;
    domainId: string;
}
export declare class UpdateRedirectDto extends CreateRedirectDto {
}
