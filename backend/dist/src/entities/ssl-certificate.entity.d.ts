import { Domain } from './domain.entity';
export declare enum CertificateStatus {
    VALID = "valid",
    EXPIRING = "expiring",
    EXPIRED = "expired",
    PENDING = "pending",
    FAILED = "failed"
}
export declare class SslCertificate {
    id: string;
    primaryDomain: string;
    sanDomains: string[];
    status: CertificateStatus;
    expiresAt: Date;
    autoRenew: boolean;
    renewBeforeDays: number;
    certificatePath: string;
    privateKeyPath: string;
    issuer: string;
    lastError: string;
    domain: Domain;
    domainId: string;
    createdAt: Date;
    updatedAt: Date;
}
