export declare class CreateSslCertificateDto {
    primaryDomain: string;
    sanDomains?: string[];
    autoRenew?: boolean;
    renewBeforeDays?: number;
    domainId: string;
}
declare const UpdateSslCertificateDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateSslCertificateDto>>;
export declare class UpdateSslCertificateDto extends UpdateSslCertificateDto_base {
}
export declare class RenewCertificateDto {
    certificateId: string;
}
export {};
