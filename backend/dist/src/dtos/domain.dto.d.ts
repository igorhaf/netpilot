export declare class CreateDomainDto {
    name: string;
    description?: string;
    projectId: string;
    isActive?: boolean;
    isLocked?: boolean;
    autoTls?: boolean;
    forceHttps?: boolean;
    blockExternalAccess?: boolean;
    enableWwwRedirect?: boolean;
    bindIp?: string;
}
export declare class UpdateDomainDto extends CreateDomainDto {
}
