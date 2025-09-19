export declare class CreateSslCertificateDto {
    primaryDomain: string;
    sanDomains?: string[];
    autoRenew?: boolean;
    renewBeforeDays?: number;
    domainId: string;
}
export declare class UpdateSslCertificateDto extends CreateSslCertificateDto {
}
export declare class RenewCertificateDto {
    certificateId: string;
}
