import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, DataSource } from 'typeorm';
import { Domain } from '../../entities/domain.entity';
import { SslCertificate, CertificateStatus } from '../../entities/ssl-certificate.entity';
import { Log, LogStatus } from '../../entities/log.entity';
import { ProxyRule } from '../../entities/proxy-rule.entity';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as mysql from 'mysql2/promise';
import { WebSocketService } from '../websocket/services/websocket.service';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Domain)
    private domainRepository: Repository<Domain>,
    @InjectRepository(SslCertificate)
    private sslCertificateRepository: Repository<SslCertificate>,
    @InjectRepository(Log)
    private logRepository: Repository<Log>,
    @InjectRepository(ProxyRule)
    private proxyRuleRepository: Repository<ProxyRule>,
    @InjectQueue('job-processor') private jobProcessorQueue: Queue,
    private dataSource: DataSource,
    private webSocketService: WebSocketService,
  ) {}

  private async getDockerContainerStatus(containerName: string): Promise<{ status: string; uptime: string }> {
    try {
      // Use Docker HTTP API via Unix socket
      const http = await import('http');

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
              } else {
                resolve({ status: 'offline', uptime: 'N/A' });
              }
            } catch (parseError) {
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
    } catch (error) {
      console.error(`Failed to get ${containerName} status:`, error);
      return { status: 'offline', uptime: 'N/A' };
    }
  }

  async getDashboardStats() {
    const [
      domainsTotal,
      domainsActive,
      proxyRulesTotal,
      proxyRulesActive,
      sslCertificatesTotal,
      sslCertificatesValid,
      sslCertificatesExpiring,
      logsTotal,
      logsSuccess,
      logsFailed,
    ] = await Promise.all([
      this.domainRepository.count(),
      this.domainRepository.count({ where: { isActive: true } }),
      this.proxyRuleRepository.count(),
      this.proxyRuleRepository.count({ where: { isActive: true } }),
      this.sslCertificateRepository.count(),
      this.sslCertificateRepository.count({ where: { status: CertificateStatus.VALID } }),
      this.sslCertificateRepository.count({
        where: {
          status: CertificateStatus.VALID,
          expiresAt: LessThan(new Date(Date.now() + (30 * 24 * 60 * 60 * 1000))),
        },
      }),
      this.logRepository.count(),
      this.logRepository.count({ where: { status: LogStatus.SUCCESS } }),
      this.logRepository.count({ where: { status: LogStatus.FAILED } }),
    ]);

    // Check PostgreSQL status
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
    } catch (error) {
      console.error('Failed to get PostgreSQL status:', error);
    }

    // Check MySQL status
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
    } catch (error) {
      console.error('Failed to get MySQL status:', error);
    }

    // Check Redis status
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
    } catch (error) {
      console.error('Failed to get Redis status:', error);
    }

    // Check WebSocket status
    let websocketStatus = 'offline';
    let websocketUptime = 'N/A';
    try {
      const stats = this.webSocketService.getConnectionStats();
      websocketStatus = 'online';
      websocketUptime = `${stats.totalConnections} conexões`;
    } catch (error) {
      console.error('Failed to get WebSocket status:', error);
    }

    // Check Nginx status (using Docker)
    const nginxStatus = await this.getDockerContainerStatus('netpilot-nginx');

    // Check Traefik status (using Docker)
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

  async getRecentLogs(limit: number = 5) {
    return this.logRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getExpiringCertificates(days: number = 30) {
    const expirationDate = new Date(Date.now() + (days * 24 * 60 * 60 * 1000));

    return this.sslCertificateRepository.find({
      where: {
        status: CertificateStatus.VALID,
        expiresAt: LessThan(expirationDate),
      },
      relations: ['domain'],
      order: { expiresAt: 'ASC' },
    });
  }
}