# SSL/TLS Management Documentation - NetPilot

## Visão Geral

O NetPilot gerencia certificados SSL/TLS automaticamente através de integração com Let's Encrypt, suportando both HTTP-01 e DNS-01 challenges, renovação automática e gestão de múltiplos domínios e subdomínios.

## Arquitetura SSL

### Fluxo de Certificação
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Let's Encrypt │    │     Traefik      │    │   NetPilot API  │
│   ACME Server   │    │  (ACME Client)   │    │  (Management)   │
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                      │                       │
          │ 1. Certificate       │                       │
          │    Request           │                       │
          │◄─────────────────────┤                       │
          │                      │                       │
          │ 2. Challenge         │                       │
          ├─────────────────────►│                       │
          │                      │                       │
          │                      │ 3. Domain            │
          │                      │    Validation        │
          │                      │◄─────────────────────┤
          │                      │                      │
          │ 4. Certificate       │                      │
          ├─────────────────────►│                      │
          │                      │                      │
          │                      │ 5. Store &           │
          │                      │    Configure         │
          │                      ├─────────────────────►│
          │                      │                      │
          │ 6. Auto Renewal      │                      │
          │    (30 days)         │                      │
          │◄────────────────────►│                      │

Storage:
├── /etc/traefik/acme/
│   ├── acme.json              # HTTP-01 certificates
│   └── acme-dns.json          # DNS-01 certificates
└── /etc/ssl/certs/
    ├── certificates/          # Public certificates
    ├── private/              # Private keys
    └── ca-certificates/      # CA chains
```

## Configuração ACME

### Traefik ACME Configuration
```yaml
# traefik.yml
certificatesResolvers:
  # HTTP-01 Challenge (requires port 80 accessible)
  letsencrypt-http:
    acme:
      email: admin@netpilot.local
      storage: /etc/traefik/acme/acme.json
      caServer: https://acme-v02.api.letsencrypt.org/directory
      httpChallenge:
        entryPoint: web

  # DNS-01 Challenge (for wildcard certificates)
  letsencrypt-dns:
    acme:
      email: admin@netpilot.local
      storage: /etc/traefik/acme/acme-dns.json
      caServer: https://acme-v02.api.letsencrypt.org/directory
      dnsChallenge:
        provider: cloudflare
        resolvers:
          - "1.1.1.1:53"
          - "8.8.8.8:53"
        delayBeforeCheck: 30s

  # Staging (for testing)
  letsencrypt-staging:
    acme:
      email: admin@netpilot.local
      storage: /etc/traefik/acme/acme-staging.json
      caServer: https://acme-staging-v02.api.letsencrypt.org/directory
      httpChallenge:
        entryPoint: web
```

### DNS Providers Configuration

#### Cloudflare
```yaml
# Environment variables
environment:
  - CF_API_EMAIL=your-email@domain.com
  - CF_API_KEY=your-global-api-key
  # OR use API Token (recommended)
  - CF_DNS_API_TOKEN=your-dns-api-token
  - CF_ZONE_API_TOKEN=your-zone-api-token

# DNS Challenge
dnsChallenge:
  provider: cloudflare
  delayBeforeCheck: 30s
  resolvers:
    - "1.1.1.1:53"
    - "1.0.0.1:53"
```

#### AWS Route53
```yaml
environment:
  - AWS_ACCESS_KEY_ID=your-access-key
  - AWS_SECRET_ACCESS_KEY=your-secret-key
  - AWS_REGION=us-east-1

dnsChallenge:
  provider: route53
  delayBeforeCheck: 30s
```

#### Google Cloud DNS
```yaml
environment:
  - GCE_PROJECT=your-project-id
  - GCE_SERVICE_ACCOUNT_FILE=/path/to/service-account.json

dnsChallenge:
  provider: gcloud
  delayBeforeCheck: 30s
```

## Backend SSL Management

### SSL Certificate Entity
```typescript
@Entity()
export class SslCertificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Domain, domain => domain.sslCertificates)
  domain: Domain;

  @Column()
  domainName: string;

  @Column('text', { array: true, default: () => 'ARRAY[]::text[]' })
  sanDomains: string[];

  @Column({ nullable: true })
  certificatePath: string;

  @Column({ nullable: true })
  privateKeyPath: string;

  @Column({ nullable: true })
  chainPath: string;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  issuedAt: Date;

  @Column({ default: true })
  autoRenew: boolean;

  @Column({ default: 30 })
  renewDaysBefore: number;

  @Column({ default: 'pending' })
  status: 'pending' | 'issued' | 'expired' | 'revoked' | 'failed';

  @Column({ nullable: true })
  issuer: string;

  @Column({ nullable: true })
  serialNumber: string;

  @Column({ type: 'json', nullable: true })
  acmeData: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### SSL Certificate Service
```typescript
@Injectable()
export class SslCertificateService {
  constructor(
    @InjectRepository(SslCertificate)
    private sslRepository: Repository<SslCertificate>,
    @InjectRepository(Domain)
    private domainRepository: Repository<Domain>,
    private acmeService: AcmeService,
    private configService: ConfigService,
  ) {}

  async requestCertificate(dto: CreateSslCertificateDto): Promise<SslCertificate> {
    const domain = await this.domainRepository.findOne({
      where: { id: dto.domainId }
    });

    if (!domain) {
      throw new NotFoundException('Domain not found');
    }

    // Check if certificate already exists
    const existing = await this.sslRepository.findOne({
      where: { domainName: dto.domainName, status: 'issued' }
    });

    if (existing && existing.expiresAt > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
      throw new ConflictException('Valid certificate already exists');
    }

    const certificate = this.sslRepository.create({
      domain,
      domainName: dto.domainName,
      sanDomains: dto.sanDomains || [],
      autoRenew: dto.autoRenew ?? true,
      renewDaysBefore: dto.renewDaysBefore ?? 30,
      status: 'pending'
    });

    await this.sslRepository.save(certificate);

    // Start async certificate generation
    this.generateCertificate(certificate.id).catch(error => {
      this.logger.error(`Failed to generate certificate: ${error.message}`, error);
    });

    return certificate;
  }

  private async generateCertificate(certificateId: string): Promise<void> {
    const certificate = await this.sslRepository.findOne({
      where: { id: certificateId },
      relations: ['domain']
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    try {
      // Generate certificate using ACME
      const acmeResult = await this.acmeService.generateCertificate({
        commonName: certificate.domainName,
        altNames: certificate.sanDomains,
        challengeType: certificate.sanDomains.some(d => d.startsWith('*')) ? 'dns-01' : 'http-01'
      });

      // Store certificate files
      const certPath = `/etc/ssl/certs/certificates/${certificate.domainName}.crt`;
      const keyPath = `/etc/ssl/certs/private/${certificate.domainName}.key`;
      const chainPath = `/etc/ssl/certs/certificates/${certificate.domainName}-chain.pem`;

      await fs.writeFile(certPath, acmeResult.certificate);
      await fs.writeFile(keyPath, acmeResult.privateKey);
      await fs.writeFile(chainPath, acmeResult.chain);

      // Update certificate record
      await this.sslRepository.update(certificate.id, {
        certificatePath: certPath,
        privateKeyPath: keyPath,
        chainPath: chainPath,
        expiresAt: acmeResult.expiresAt,
        issuedAt: new Date(),
        status: 'issued',
        issuer: acmeResult.issuer,
        serialNumber: acmeResult.serialNumber,
        acmeData: acmeResult.metadata
      });

      // Update Traefik configuration
      await this.updateTraefikConfig(certificate);

      this.logger.log(`Certificate generated successfully for ${certificate.domainName}`);

    } catch (error) {
      await this.sslRepository.update(certificate.id, {
        status: 'failed'
      });

      this.logger.error(`Certificate generation failed for ${certificate.domainName}:`, error);
      throw error;
    }
  }

  async renewExpiredCertificates(): Promise<void> {
    const expiringCertificates = await this.sslRepository.find({
      where: {
        status: 'issued',
        autoRenew: true,
        expiresAt: LessThan(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
      },
      relations: ['domain']
    });

    this.logger.log(`Found ${expiringCertificates.length} certificates to renew`);

    for (const cert of expiringCertificates) {
      try {
        await this.renewCertificate(cert.id);
      } catch (error) {
        this.logger.error(`Failed to renew certificate ${cert.domainName}:`, error);
      }
    }
  }

  async renewCertificate(certificateId: string): Promise<void> {
    const certificate = await this.sslRepository.findOne({
      where: { id: certificateId },
      relations: ['domain']
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    this.logger.log(`Renewing certificate for ${certificate.domainName}`);

    // Set status to pending renewal
    await this.sslRepository.update(certificate.id, { status: 'pending' });

    // Generate new certificate
    await this.generateCertificate(certificate.id);
  }

  private async updateTraefikConfig(certificate: SslCertificate): Promise<void> {
    const tlsConfig = {
      tls: {
        certificates: [{
          certFile: certificate.certificatePath,
          keyFile: certificate.privateKeyPath,
          stores: ['default']
        }]
      }
    };

    const configPath = `/etc/traefik/dynamic/ssl-${certificate.domainName}.yml`;
    await fs.writeFile(configPath, yaml.dump(tlsConfig));
  }

  async checkCertificateValidity(domainName: string): Promise<CertificateInfo> {
    return new Promise((resolve, reject) => {
      const options = {
        host: domainName,
        port: 443,
        servername: domainName
      };

      const socket = tls.connect(options, () => {
        const cert = socket.getPeerCertificate();

        if (!cert || !cert.subject) {
          reject(new Error('No certificate found'));
          return;
        }

        const info: CertificateInfo = {
          subject: cert.subject,
          issuer: cert.issuer,
          validFrom: new Date(cert.valid_from),
          validTo: new Date(cert.valid_to),
          fingerprint: cert.fingerprint,
          serialNumber: cert.serialNumber,
          subjectAltName: cert.subjectaltname?.split(', ') || []
        };

        socket.end();
        resolve(info);
      });

      socket.on('error', reject);
      socket.setTimeout(10000, () => {
        socket.destroy();
        reject(new Error('Connection timeout'));
      });
    });
  }
}
```

### ACME Service Implementation
```typescript
@Injectable()
export class AcmeService {
  private acmeClient: AcmeClient;

  constructor(private configService: ConfigService) {
    this.initializeAcmeClient();
  }

  private async initializeAcmeClient(): Promise<void> {
    const directoryUrl = this.configService.get('ACME_STAGING') === 'true'
      ? AcmeClient.directory.letsencrypt.staging
      : AcmeClient.directory.letsencrypt.production;

    this.acmeClient = new AcmeClient({
      directoryUrl,
      accountKey: await this.getOrCreateAccountKey(),
      accountUrl: await this.getAccountUrl()
    });
  }

  async generateCertificate(options: CertificateOptions): Promise<CertificateResult> {
    const { commonName, altNames = [], challengeType = 'http-01' } = options;

    // Create certificate signing request
    const [key, csr] = await AcmeClient.crypto.createCsr({
      commonName,
      altNames
    });

    // Submit order
    const order = await this.acmeClient.createOrder({
      identifiers: [
        { type: 'dns', value: commonName },
        ...altNames.map(name => ({ type: 'dns', value: name }))
      ]
    });

    // Process authorizations
    const authorizations = await this.acmeClient.getAuthorizations(order);

    for (const authz of authorizations) {
      if (authz.status === 'valid') continue;

      const challenge = challengeType === 'dns-01'
        ? authz.challenges.find(c => c.type === 'dns-01')
        : authz.challenges.find(c => c.type === 'http-01');

      if (!challenge) {
        throw new Error(`${challengeType} challenge not available`);
      }

      if (challengeType === 'dns-01') {
        await this.setupDnsChallenge(authz.identifier.value, challenge);
      } else {
        await this.setupHttpChallenge(authz.identifier.value, challenge);
      }

      // Verify challenge
      await this.acmeClient.verifyChallenge(authz, challenge);

      // Wait for validation
      await this.acmeClient.completeChallenge(challenge);
      await this.acmeClient.waitForValidAuth(authz);
    }

    // Finalize order
    await this.acmeClient.finalizeOrder(order, csr);
    const certificate = await this.acmeClient.getCertificate(order);

    // Parse certificate
    const certInfo = await this.parseCertificate(certificate);

    return {
      certificate: certificate,
      privateKey: key.toString(),
      chain: certificate,
      expiresAt: certInfo.validTo,
      issuer: certInfo.issuer.CN,
      serialNumber: certInfo.serialNumber,
      metadata: {
        orderId: order.url,
        authorizations: authorizations.map(a => a.url)
      }
    };
  }

  private async setupHttpChallenge(domain: string, challenge: any): Promise<void> {
    const keyAuthorization = await this.acmeClient.getChallengeKeyAuthorization(challenge);
    const challengePath = `/var/www/html/.well-known/acme-challenge/${challenge.token}`;

    await fs.ensureDir(path.dirname(challengePath));
    await fs.writeFile(challengePath, keyAuthorization);

    this.logger.log(`HTTP challenge set up for ${domain}: ${challengePath}`);
  }

  private async setupDnsChallenge(domain: string, challenge: any): Promise<void> {
    const keyAuthorization = await this.acmeClient.getChallengeKeyAuthorization(challenge);
    const dnsValue = AcmeClient.crypto.digestMessage(keyAuthorization, 'sha256', 'base64url');

    // Use DNS provider API to create TXT record
    await this.createDnsTxtRecord(`_acme-challenge.${domain}`, dnsValue);

    // Wait for DNS propagation
    await this.waitForDnsPropagation(`_acme-challenge.${domain}`, dnsValue);

    this.logger.log(`DNS challenge set up for ${domain}: _acme-challenge.${domain} = ${dnsValue}`);
  }

  private async createDnsTxtRecord(name: string, value: string): Promise<void> {
    const provider = this.configService.get('DNS_PROVIDER');

    switch (provider) {
      case 'cloudflare':
        await this.cloudflareCreateTxtRecord(name, value);
        break;
      case 'route53':
        await this.route53CreateTxtRecord(name, value);
        break;
      default:
        throw new Error(`Unsupported DNS provider: ${provider}`);
    }
  }

  private async cloudflareCreateTxtRecord(name: string, value: string): Promise<void> {
    const zoneId = await this.getCloudflareZoneId(name);
    const apiToken = this.configService.get('CF_DNS_API_TOKEN');

    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'TXT',
        name: name,
        content: value,
        ttl: 120
      })
    });

    if (!response.ok) {
      throw new Error(`Cloudflare API error: ${response.statusText}`);
    }
  }

  private async waitForDnsPropagation(name: string, expectedValue: string): Promise<void> {
    const maxAttempts = 30;
    const delay = 10000; // 10 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const records = await this.queryTxtRecords(name);

        if (records.includes(expectedValue)) {
          this.logger.log(`DNS propagation confirmed for ${name}`);
          return;
        }

        this.logger.log(`DNS propagation attempt ${attempt + 1}/${maxAttempts} for ${name}`);
        await new Promise(resolve => setTimeout(resolve, delay));

      } catch (error) {
        this.logger.warn(`DNS query failed for ${name}:`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error(`DNS propagation timeout for ${name}`);
  }

  private async queryTxtRecords(name: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      dns.resolveTxt(name, (err, records) => {
        if (err) {
          reject(err);
          return;
        }

        const txtRecords = records.map(record => record.join(''));
        resolve(txtRecords);
      });
    });
  }
}
```

## Cron Jobs para Renovação Automática

### Renewal Service
```typescript
@Injectable()
export class CertificateRenewalService {
  constructor(
    private sslCertificateService: SslCertificateService,
  ) {}

  @Cron('0 2 * * *') // Daily at 2 AM
  async handleDailyRenewal(): Promise<void> {
    this.logger.log('Starting daily certificate renewal check');

    try {
      await this.sslCertificateService.renewExpiredCertificates();
      this.logger.log('Daily certificate renewal check completed');
    } catch (error) {
      this.logger.error('Daily certificate renewal failed:', error);
    }
  }

  @Cron('0 1 1 * *') // Monthly on 1st at 1 AM
  async handleMonthlyCleanup(): Promise<void> {
    this.logger.log('Starting monthly certificate cleanup');

    try {
      await this.cleanupExpiredCertificates();
      await this.cleanupOrphanedFiles();
      this.logger.log('Monthly certificate cleanup completed');
    } catch (error) {
      this.logger.error('Monthly certificate cleanup failed:', error);
    }
  }

  private async cleanupExpiredCertificates(): Promise<void> {
    // Remove certificates expired for more than 30 days
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    await this.sslCertificateService.removeExpiredCertificates(cutoffDate);
  }

  private async cleanupOrphanedFiles(): Promise<void> {
    // Remove certificate files without database records
    const certDir = '/etc/ssl/certs/certificates';
    const keyDir = '/etc/ssl/certs/private';

    const certFiles = await fs.readdir(certDir);
    const keyFiles = await fs.readdir(keyDir);

    for (const file of [...certFiles, ...keyFiles]) {
      const domainName = file.replace(/\.(crt|key|pem)$/, '');
      const exists = await this.sslCertificateService.certificateExists(domainName);

      if (!exists) {
        await fs.unlink(path.join(certDir, file));
        this.logger.log(`Removed orphaned certificate file: ${file}`);
      }
    }
  }
}
```

## Monitoring e Alertas

### Certificate Monitoring
```typescript
@Injectable()
export class CertificateMonitoringService {
  async checkCertificateHealth(): Promise<CertificateHealthReport> {
    const certificates = await this.sslCertificateService.findAll();
    const report: CertificateHealthReport = {
      total: certificates.length,
      valid: 0,
      expiring: 0,
      expired: 0,
      failed: 0,
      details: []
    };

    for (const cert of certificates) {
      const status = await this.getCertificateStatus(cert);
      report.details.push(status);

      switch (status.status) {
        case 'valid':
          report.valid++;
          break;
        case 'expiring':
          report.expiring++;
          break;
        case 'expired':
          report.expired++;
          break;
        case 'failed':
          report.failed++;
          break;
      }
    }

    // Send alerts if needed
    if (report.expiring > 0 || report.expired > 0) {
      await this.sendCertificateAlert(report);
    }

    return report;
  }

  private async getCertificateStatus(cert: SslCertificate): Promise<CertificateStatus> {
    const now = new Date();
    const expiryThreshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (cert.status === 'failed') {
      return {
        domainName: cert.domainName,
        status: 'failed',
        expiresAt: cert.expiresAt,
        daysUntilExpiry: null,
        message: 'Certificate generation failed'
      };
    }

    if (!cert.expiresAt || cert.expiresAt < now) {
      return {
        domainName: cert.domainName,
        status: 'expired',
        expiresAt: cert.expiresAt,
        daysUntilExpiry: cert.expiresAt ? Math.floor((cert.expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)) : null,
        message: 'Certificate expired'
      };
    }

    if (cert.expiresAt < expiryThreshold) {
      const daysUntilExpiry = Math.floor((cert.expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      return {
        domainName: cert.domainName,
        status: 'expiring',
        expiresAt: cert.expiresAt,
        daysUntilExpiry,
        message: `Certificate expires in ${daysUntilExpiry} days`
      };
    }

    const daysUntilExpiry = Math.floor((cert.expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return {
      domainName: cert.domainName,
      status: 'valid',
      expiresAt: cert.expiresAt,
      daysUntilExpiry,
      message: `Certificate valid for ${daysUntilExpiry} days`
    };
  }

  private async sendCertificateAlert(report: CertificateHealthReport): Promise<void> {
    // Implementation depends on notification service
    // Could be email, Slack, webhook, etc.

    const alertMessage = `
Certificate Alert - NetPilot

Expiring certificates: ${report.expiring}
Expired certificates: ${report.expired}

Details:
${report.details
  .filter(d => d.status === 'expiring' || d.status === 'expired')
  .map(d => `- ${d.domainName}: ${d.message}`)
  .join('\n')}
    `;

    // Send notification
    await this.notificationService.send({
      subject: 'NetPilot Certificate Alert',
      message: alertMessage,
      severity: report.expired > 0 ? 'critical' : 'warning'
    });
  }
}
```

## Certificate Backup e Recovery

### Backup Script
```bash
#!/bin/bash
# scripts/backup-certificates.sh

BACKUP_DIR="/backup/ssl"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup certificate files
tar czf $BACKUP_DIR/certificates_$DATE.tar.gz \
  /etc/ssl/certs/certificates/ \
  /etc/ssl/certs/private/ \
  /etc/ssl/certs/ca-certificates/

# Backup ACME data
cp /etc/traefik/acme/acme.json $BACKUP_DIR/acme_$DATE.json
cp /etc/traefik/acme/acme-dns.json $BACKUP_DIR/acme-dns_$DATE.json

# Backup database
docker-compose exec -T db pg_dump -U netpilot -t ssl_certificates netpilot > $BACKUP_DIR/ssl_certificates_$DATE.sql

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.json" -mtime +30 -delete
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete

echo "SSL backup completed: $BACKUP_DIR"
```

### Recovery Script
```bash
#!/bin/bash
# scripts/restore-certificates.sh

BACKUP_FILE="$1"
DATE=$(date +%Y%m%d_%H%M%S)

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

echo "WARNING: This will restore SSL certificates from backup!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" = "yes" ]; then
    # Backup current state
    tar czf /backup/ssl/current_state_$DATE.tar.gz \
      /etc/ssl/certs/ \
      /etc/traefik/acme/

    # Restore from backup
    tar xzf $BACKUP_FILE -C /

    # Restart services
    docker-compose restart traefik nginx

    echo "Certificate restoration completed"
else
    echo "Restoration cancelled"
fi
```

## Troubleshooting

### Common SSL Issues

#### Certificate Not Generated
```bash
# Check ACME logs
docker-compose logs traefik | grep -i acme

# Verify domain is accessible
curl -I http://domain.com/.well-known/acme-challenge/test

# Check DNS for DNS-01 challenge
dig _acme-challenge.domain.com TXT

# Verify port 80 is accessible
telnet domain.com 80
```

#### Certificate Expired
```bash
# Check certificate status
openssl x509 -in /path/to/cert.pem -text -noout | grep -A 2 "Validity"

# Force renewal
curl -X POST http://localhost:3001/ssl-certificates/{id}/renew

# Manual renewal via Traefik
docker-compose exec traefik rm /etc/traefik/acme/acme.json
docker-compose restart traefik
```

#### Invalid Certificate Chain
```bash
# Verify certificate chain
openssl verify -CAfile /etc/ssl/certs/ca-certificates.crt /path/to/cert.pem

# Check online
curl https://www.ssllabs.com/ssltest/analyze.html?d=domain.com

# Test with OpenSSL
openssl s_client -connect domain.com:443 -verify_return_error
```

#### Rate Limits
```bash
# Check Let's Encrypt rate limits
# Production: 50 certificates per registered domain per week
# 5 duplicate certificates per week

# Use staging for testing
ACME_STAGING=true docker-compose up -d

# Monitor rate limit status
curl https://crt.sh/?q=domain.com
```

---

**Importante**: Sempre use o ambiente de staging do Let's Encrypt durante testes para evitar atingir rate limits em produção. Mantenha backups regulares dos certificados e dados ACME.