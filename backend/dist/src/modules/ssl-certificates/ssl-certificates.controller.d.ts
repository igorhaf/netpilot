import { SslCertificatesService } from './ssl-certificates.service';
import { CreateSslCertificateDto, UpdateSslCertificateDto } from '../../dtos/ssl-certificate.dto';
export declare class SslCertificatesController {
    private readonly sslCertificatesService;
    constructor(sslCertificatesService: SslCertificatesService);
    create(createSslCertificateDto: CreateSslCertificateDto): Promise<import("../../entities/ssl-certificate.entity").SslCertificate>;
    findAll(): Promise<import("../../entities/ssl-certificate.entity").SslCertificate[]>;
    getStats(): Promise<{
        total: number;
        valid: number;
        expiring: number;
        expired: number;
    }>;
    renewExpired(): Promise<{
        success: boolean;
        renewed: number;
        failed: number;
    }>;
    renewCertificate(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    findOne(id: string): Promise<import("../../entities/ssl-certificate.entity").SslCertificate>;
    update(id: string, updateSslCertificateDto: UpdateSslCertificateDto): Promise<import("../../entities/ssl-certificate.entity").SslCertificate>;
    toggleLock(id: string): Promise<import("../../entities/ssl-certificate.entity").SslCertificate>;
    remove(id: string): Promise<void>;
}
