import { Repository } from 'typeorm';
import { Domain } from '../../entities/domain.entity';
import { SslCertificate } from '../../entities/ssl-certificate.entity';
import { Log } from '../../entities/log.entity';
import { ProxyRule } from '../../entities/proxy-rule.entity';
export declare class DashboardService {
    private domainRepository;
    private sslCertificateRepository;
    private logRepository;
    private proxyRuleRepository;
    constructor(domainRepository: Repository<Domain>, sslCertificateRepository: Repository<SslCertificate>, logRepository: Repository<Log>, proxyRuleRepository: Repository<ProxyRule>);
    getDashboardStats(): Promise<{
        domains: {
            total: number;
            active: number;
            inactive: number;
        };
        proxyRules: {
            total: number;
            active: number;
            inactive: number;
        };
        sslCertificates: {
            total: number;
            valid: number;
            expiring: number;
            expired: number;
        };
        logs: {
            total: number;
            success: number;
            failed: number;
            running: number;
        };
        systemStatus: {
            nginx: {
                status: string;
                uptime: string;
            };
            traefik: {
                status: string;
                uptime: string;
            };
            database: {
                status: string;
                uptime: string;
            };
        };
    }>;
    getRecentLogs(limit?: number): Promise<Log[]>;
    getExpiringCertificates(days?: number): Promise<SslCertificate[]>;
}
