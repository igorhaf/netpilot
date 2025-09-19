import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getStats(): Promise<{
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
    getRecentLogs(limit?: number): Promise<import("../../entities/log.entity").Log[]>;
    getExpiringCertificates(days?: number): Promise<import("../../entities/ssl-certificate.entity").SslCertificate[]>;
}
