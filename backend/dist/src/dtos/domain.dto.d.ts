export declare class CreateDomainDto {
    name: string;
    description?: string;
    isActive?: boolean;
    autoTls?: boolean;
    forceHttps?: boolean;
    blockExternalAccess?: boolean;
    enableWwwRedirect?: boolean;
    bindIp?: string;
}
export declare class UpdateDomainDto extends CreateDomainDto {
}
