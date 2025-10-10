"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const domain_entity_1 = require("../../entities/domain.entity");
const ssl_certificate_entity_1 = require("../../entities/ssl-certificate.entity");
const log_entity_1 = require("../../entities/log.entity");
const proxy_rule_entity_1 = require("../../entities/proxy-rule.entity");
const bull_1 = require("@nestjs/bull");
const mysql = require("mysql2/promise");
const websocket_service_1 = require("../websocket/services/websocket.service");
let DashboardService = class DashboardService {
    constructor(domainRepository, sslCertificateRepository, logRepository, proxyRuleRepository, jobProcessorQueue, dataSource, webSocketService) {
        this.domainRepository = domainRepository;
        this.sslCertificateRepository = sslCertificateRepository;
        this.logRepository = logRepository;
        this.proxyRuleRepository = proxyRuleRepository;
        this.jobProcessorQueue = jobProcessorQueue;
        this.dataSource = dataSource;
        this.webSocketService = webSocketService;
    }
    async getDockerContainerStatus(containerName) {
        try {
            const http = await Promise.resolve().then(() => require('http'));
            return new Promise((resolve) => {
                const req = http.request({
                    socketPath: '/var/run/docker.sock',
                    path: `/containers/${containerName}/json`,
                    method: 'GET',
                }, (res) => {
                    let data = '';
                    res.on('data', (chunk) => data += chunk);
                    res.on('end', () => {
                        try {
                            const containerInfo = JSON.parse(data);
                            const state = containerInfo.State?.Status;
                            const startedAt = containerInfo.State?.StartedAt;
                            if (state === 'running' && startedAt) {
                                const startTime = new Date(startedAt);
                                const uptimeMs = Date.now() - startTime.getTime();
                                const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
                                const hours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                const uptime = days > 0 ? `${days}d ${hours}h` : `${hours}h`;
                                resolve({ status: 'online', uptime });
                            }
                            else {
                                resolve({ status: 'offline', uptime: 'N/A' });
                            }
                        }
                        catch (parseError) {
                            console.error(`Failed to parse Docker response for ${containerName}:`, parseError);
                            resolve({ status: 'offline', uptime: 'N/A' });
                        }
                    });
                });
                req.on('error', (error) => {
                    console.error(`Failed to get ${containerName} status:`, error);
                    resolve({ status: 'offline', uptime: 'N/A' });
                });
                req.end();
            });
        }
        catch (error) {
            console.error(`Failed to get ${containerName} status:`, error);
            return { status: 'offline', uptime: 'N/A' };
        }
    }
    async getDashboardStats() {
        const [domainsTotal, domainsActive, proxyRulesTotal, proxyRulesActive, sslCertificatesTotal, sslCertificatesValid, sslCertificatesExpiring, logsTotal, logsSuccess, logsFailed,] = await Promise.all([
            this.domainRepository.count(),
            this.domainRepository.count({ where: { isActive: true } }),
            this.proxyRuleRepository.count(),
            this.proxyRuleRepository.count({ where: { isActive: true } }),
            this.sslCertificateRepository.count(),
            this.sslCertificateRepository.count({ where: { status: ssl_certificate_entity_1.CertificateStatus.VALID } }),
            this.sslCertificateRepository.count({
                where: {
                    status: ssl_certificate_entity_1.CertificateStatus.VALID,
                    expiresAt: (0, typeorm_2.LessThan)(new Date(Date.now() + (30 * 24 * 60 * 60 * 1000))),
                },
            }),
            this.logRepository.count(),
            this.logRepository.count({ where: { status: log_entity_1.LogStatus.SUCCESS } }),
            this.logRepository.count({ where: { status: log_entity_1.LogStatus.FAILED } }),
        ]);
        let postgresStatus = 'offline';
        let postgresUptime = 'N/A';
        try {
            const result = await this.dataSource.query('SELECT pg_postmaster_start_time()');
            if (result && result[0]) {
                const startTime = new Date(result[0].pg_postmaster_start_time);
                const uptimeMs = Date.now() - startTime.getTime();
                const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
                const hours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                postgresUptime = days > 0 ? `${days}d ${hours}h` : `${hours}h`;
            }
            postgresStatus = 'online';
        }
        catch (error) {
            console.error('Failed to get PostgreSQL status:', error);
        }
        let mysqlStatus = 'offline';
        let mysqlUptime = 'N/A';
        try {
            const mysqlUrl = process.env.MYSQL_URL || 'mysql://netpilot:netpilot123@172.19.0.4:3306/netpilot';
            const connection = await mysql.createConnection(mysqlUrl);
            const [rows] = await connection.query('SHOW STATUS LIKE "Uptime"');
            if (rows && rows[0] && rows[0].Value) {
                const uptimeSeconds = parseInt(rows[0].Value);
                const days = Math.floor(uptimeSeconds / 86400);
                const hours = Math.floor((uptimeSeconds % 86400) / 3600);
                mysqlUptime = days > 0 ? `${days}d ${hours}h` : `${hours}h`;
            }
            await connection.end();
            mysqlStatus = 'online';
        }
        catch (error) {
            console.error('Failed to get MySQL status:', error);
        }
        let redisStatus = 'offline';
        let redisUptime = 'N/A';
        try {
            const redisClient = await this.jobProcessorQueue.client;
            const info = await redisClient.info('server');
            const uptimeMatch = info.match(/uptime_in_seconds:(\d+)/);
            if (uptimeMatch) {
                const uptimeSeconds = parseInt(uptimeMatch[1]);
                const days = Math.floor(uptimeSeconds / 86400);
                const hours = Math.floor((uptimeSeconds % 86400) / 3600);
                redisUptime = days > 0 ? `${days}d ${hours}h` : `${hours}h`;
            }
            redisStatus = 'online';
        }
        catch (error) {
            console.error('Failed to get Redis status:', error);
        }
        let websocketStatus = 'offline';
        let websocketUptime = 'N/A';
        try {
            const stats = this.webSocketService.getConnectionStats();
            websocketStatus = 'online';
            websocketUptime = `${stats.totalConnections} conexões`;
        }
        catch (error) {
            console.error('Failed to get WebSocket status:', error);
        }
        const nginxStatus = await this.getDockerContainerStatus('netpilot-nginx');
        const traefikStatus = await this.getDockerContainerStatus('netpilot-traefik');
        return {
            domains: {
                total: domainsTotal,
                active: domainsActive,
                inactive: domainsTotal - domainsActive,
            },
            proxyRules: {
                total: proxyRulesTotal,
                active: proxyRulesActive,
                inactive: proxyRulesTotal - proxyRulesActive,
            },
            sslCertificates: {
                total: sslCertificatesTotal,
                valid: sslCertificatesValid,
                expiring: sslCertificatesExpiring,
                expired: sslCertificatesTotal - sslCertificatesValid,
            },
            logs: {
                total: logsTotal,
                success: logsSuccess,
                failed: logsFailed,
                running: logsTotal - logsSuccess - logsFailed,
            },
            systemStatus: {
                nginx: {
                    status: nginxStatus.status,
                    uptime: nginxStatus.uptime,
                },
                traefik: {
                    status: traefikStatus.status,
                    uptime: traefikStatus.uptime,
                },
                postgresql: {
                    status: postgresStatus,
                    uptime: postgresUptime,
                },
                mysql: {
                    status: mysqlStatus,
                    uptime: mysqlUptime,
                },
                redis: {
                    status: redisStatus,
                    uptime: redisUptime,
                },
                websocket: {
                    status: websocketStatus,
                    uptime: websocketUptime,
                },
            },
        };
    }
    async getRecentLogs(limit = 5) {
        return this.logRepository.find({
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
    async getExpiringCertificates(days = 30) {
        const expirationDate = new Date(Date.now() + (days * 24 * 60 * 60 * 1000));
        return this.sslCertificateRepository.find({
            where: {
                status: ssl_certificate_entity_1.CertificateStatus.VALID,
                expiresAt: (0, typeorm_2.LessThan)(expirationDate),
            },
            relations: ['domain'],
            order: { expiresAt: 'ASC' },
        });
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(domain_entity_1.Domain)),
    __param(1, (0, typeorm_1.InjectRepository)(ssl_certificate_entity_1.SslCertificate)),
    __param(2, (0, typeorm_1.InjectRepository)(log_entity_1.Log)),
    __param(3, (0, typeorm_1.InjectRepository)(proxy_rule_entity_1.ProxyRule)),
    __param(4, (0, bull_1.InjectQueue)('job-processor')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository, Object, typeorm_2.DataSource,
        websocket_service_1.WebSocketService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map