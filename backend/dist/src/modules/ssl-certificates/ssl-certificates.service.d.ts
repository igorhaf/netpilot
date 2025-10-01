import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { SslCertificate } from '../../entities/ssl-certificate.entity';
import { CreateSslCertificateDto, UpdateSslCertificateDto } from '../../dtos/ssl-certificate.dto';
export declare class SslCertificatesService {
    private sslCertificateRepository;
    private readonly httpService;
    private readonly configService;
    private readonly logger;
    private readonly systemOpsUrl;
    constructor(sslCertificateRepository: Repository<SslCertificate>, httpService: HttpService, configService: ConfigService);
    create(createSslCertificateDto: CreateSslCertificateDto): Promise<SslCertificate>;
    private findDomainById;
    private validateDomainName;
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
    private deleteCertificateFiles;
    renewExpiredCertificates(): Promise<{
        success: boolean;
        renewed: number;
        failed: number;
    }>;
}
