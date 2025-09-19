import { Repository } from 'typeorm';
import { SslCertificate } from '../../entities/ssl-certificate.entity';
import { CreateSslCertificateDto, UpdateSslCertificateDto } from '../../dtos/ssl-certificate.dto';
export declare class SslCertificatesService {
    private sslCertificateRepository;
    constructor(sslCertificateRepository: Repository<SslCertificate>);
    create(createSslCertificateDto: CreateSslCertificateDto): Promise<SslCertificate>;
    findAll(): Promise<SslCertificate[]>;
    findOne(id: string): Promise<SslCertificate>;
    update(id: string, updateSslCertificateDto: UpdateSslCertificateDto): Promise<SslCertificate>;
    remove(id: string): Promise<void>;
    getStats(): Promise<{
        total: number;
        valid: number;
        expiring: number;
        expired: number;
    }>;
    renewCertificate(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    renewExpiredCertificates(): Promise<{
        success: boolean;
        renewed: number;
        failed: number;
    }>;
}
