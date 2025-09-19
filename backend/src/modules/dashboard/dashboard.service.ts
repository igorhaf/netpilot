import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Domain } from '../../entities/domain.entity';
import { SslCertificate, CertificateStatus } from '../../entities/ssl-certificate.entity';
import { Log, LogStatus } from '../../entities/log.entity';
import { ProxyRule } from '../../entities/proxy-rule.entity';

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
  ) {}

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
          status: 'online',
          uptime: '99.8%',
        },
        traefik: {
          status: 'online',
          uptime: '99.9%',
        },
        database: {
          status: 'online',
          uptime: '100%',
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