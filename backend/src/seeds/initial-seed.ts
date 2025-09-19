import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { Domain } from '../entities/domain.entity';
import { ProxyRule } from '../entities/proxy-rule.entity';
import { Redirect, RedirectType } from '../entities/redirect.entity';
import { SslCertificate, CertificateStatus } from '../entities/ssl-certificate.entity';
import { Log, LogType, LogStatus } from '../entities/log.entity';

@Injectable()
export class InitialSeedService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Domain)
    private domainRepository: Repository<Domain>,
    @InjectRepository(ProxyRule)
    private proxyRuleRepository: Repository<ProxyRule>,
    @InjectRepository(Redirect)
    private redirectRepository: Repository<Redirect>,
    @InjectRepository(SslCertificate)
    private sslCertificateRepository: Repository<SslCertificate>,
    @InjectRepository(Log)
    private logRepository: Repository<Log>,
  ) {}

  async seed() {
    // Create admin user
    const existingUser = await this.userRepository.findOne({
      where: { email: 'admin@netpilot.local' },
    });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminUser = this.userRepository.create({
        email: 'admin@netpilot.local',
        password: hashedPassword,
        role: 'admin',
      });
      await this.userRepository.save(adminUser);
      console.log('✅ Admin user created: admin@netpilot.local / admin123');
    }

    // Create sample domain
    const existingDomain = await this.domainRepository.findOne({
      where: { name: 'netpilot.meadadigital.com' },
    });

    if (!existingDomain) {
      const sampleDomain = this.domainRepository.create({
        name: 'netpilot.meadadigital.com',
        description: 'Domínio principal do NetPilot',
        isActive: true,
        autoTls: true,
        forceHttps: true,
        blockExternalAccess: false,
        enableWwwRedirect: true,
        bindIp: '127.0.0.1',
      });
      const savedDomain = await this.domainRepository.save(sampleDomain);

      // Create sample proxy rule
      const sampleProxyRule = this.proxyRuleRepository.create({
        sourcePath: '/api/*',
        targetUrl: 'http://backend:3001',
        priority: 1,
        isActive: true,
        maintainQueryStrings: true,
        description: 'Proxy para API backend',
        domainId: savedDomain.id,
      });
      await this.proxyRuleRepository.save(sampleProxyRule);

      // Create sample redirect
      const sampleRedirect = this.redirectRepository.create({
        sourcePattern: '/old-dashboard',
        targetUrl: '/dashboard',
        type: RedirectType.PERMANENT,
        isActive: true,
        priority: 1,
        description: 'Redirect dashboard antigo',
        domainId: savedDomain.id,
      });
      await this.redirectRepository.save(sampleRedirect);

      // Create sample SSL certificate
      const sampleCertificate = this.sslCertificateRepository.create({
        primaryDomain: 'netpilot.meadadigital.com',
        sanDomains: ['www.netpilot.meadadigital.com'],
        status: CertificateStatus.VALID,
        expiresAt: new Date(Date.now() + (85 * 24 * 60 * 60 * 1000)), // 85 days from now
        autoRenew: true,
        renewBeforeDays: 30,
        issuer: "Let's Encrypt",
        domainId: savedDomain.id,
      });
      await this.sslCertificateRepository.save(sampleCertificate);

      console.log('✅ Sample domain and configurations created');
    }

    // Create sample logs
    const logCount = await this.logRepository.count();
    if (logCount === 0) {
      const sampleLogs = [
        {
          type: LogType.DEPLOYMENT,
          status: LogStatus.SUCCESS,
          action: 'Deploy do Nginx',
          message: 'Configuração do Nginx aplicada com sucesso',
          duration: 2500,
          startedAt: new Date(Date.now() - 3600000), // 1 hour ago
          completedAt: new Date(Date.now() - 3597500),
        },
        {
          type: LogType.SSL_RENEWAL,
          status: LogStatus.SUCCESS,
          action: 'Renovação SSL netpilot.meadadigital.com',
          message: 'Certificado SSL renovado com sucesso',
          duration: 15000,
          startedAt: new Date(Date.now() - 7200000), // 2 hours ago
          completedAt: new Date(Date.now() - 7185000),
        },
        {
          type: LogType.TRAEFIK_RELOAD,
          status: LogStatus.SUCCESS,
          action: 'Reload do Traefik',
          message: 'Configuração do Traefik recarregada',
          duration: 1200,
          startedAt: new Date(Date.now() - 1800000), // 30 minutes ago
          completedAt: new Date(Date.now() - 1798800),
        },
      ];

      for (const logData of sampleLogs) {
        const log = this.logRepository.create(logData);
        await this.logRepository.save(log);
      }

      console.log('✅ Sample logs created');
    }

    console.log('🌱 Database seeding completed');
  }
}