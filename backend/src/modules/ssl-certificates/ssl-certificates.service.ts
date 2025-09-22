import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { SslCertificate, CertificateStatus } from '../../entities/ssl-certificate.entity';
import { CreateSslCertificateDto, UpdateSslCertificateDto } from '../../dtos/ssl-certificate.dto';

@Injectable()
export class SslCertificatesService {
  constructor(
    @InjectRepository(SslCertificate)
    private sslCertificateRepository: Repository<SslCertificate>,
  ) {}

  async create(createSslCertificateDto: CreateSslCertificateDto): Promise<SslCertificate> {
    // Validate domain exists
    const domain = await this.findDomainById(createSslCertificateDto.domainId);
    if (!domain) {
      throw new NotFoundException('Domínio não encontrado');
    }

    // Check if certificate already exists for this domain
    const existingCert = await this.sslCertificateRepository.findOne({
      where: { primaryDomain: createSslCertificateDto.primaryDomain }
    });

    if (existingCert) {
      throw new BadRequestException('Já existe um certificado para este domínio');
    }

    // Validate domain name format
    this.validateDomainName(createSslCertificateDto.primaryDomain);

    // Validate SAN domains if provided
    if (createSslCertificateDto.sanDomains?.length > 0) {
      createSslCertificateDto.sanDomains.forEach(domain => {
        this.validateDomainName(domain);
      });
    }

    // Create certificate
    const certificate = this.sslCertificateRepository.create(createSslCertificateDto);

    try {
      // Issue new certificate via ACME
      const certData = await this.issueNewCertificate(
        createSslCertificateDto.primaryDomain,
        createSslCertificateDto.sanDomains
      );

      certificate.certificatePath = certData.certificatePath;
      certificate.privateKeyPath = certData.privateKeyPath;
      certificate.expiresAt = certData.expiresAt;
      certificate.status = CertificateStatus.VALID;

    } catch (error) {
      certificate.status = CertificateStatus.FAILED;
      certificate.lastError = error.message;
    }

    return await this.sslCertificateRepository.save(certificate);
  }

  private async findDomainById(domainId: string): Promise<any> {
    // TODO: Inject Domain repository and implement proper domain lookup
    // For now, simulate domain existence
    return { id: domainId, name: 'example.com' };
  }

  private validateDomainName(domain: string): void {
    if (!domain || typeof domain !== 'string') {
      throw new BadRequestException('Nome do domínio é obrigatório');
    }

    // Basic domain validation regex
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!domainRegex.test(domain)) {
      throw new BadRequestException(`Formato de domínio inválido: ${domain}`);
    }

    if (domain.length > 253) {
      throw new BadRequestException('Nome do domínio muito longo');
    }

    if (domain.includes('..')) {
      throw new BadRequestException('Domínio não pode conter pontos consecutivos');
    }
  }

  async findAll(): Promise<SslCertificate[]> {
    return this.sslCertificateRepository.find({
      relations: ['domain'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<SslCertificate> {
    const certificate = await this.sslCertificateRepository.findOne({
      where: { id },
      relations: ['domain'],
    });

    if (!certificate) {
      throw new NotFoundException('Certificado SSL não encontrado');
    }

    return certificate;
  }

  async update(id: string, updateSslCertificateDto: UpdateSslCertificateDto): Promise<SslCertificate> {
    const certificate = await this.findOne(id);
    Object.assign(certificate, updateSslCertificateDto);
    return await this.sslCertificateRepository.save(certificate);
  }

  async remove(id: string): Promise<void> {
    const certificate = await this.findOne(id);

    // Delete certificate files from disk
    await this.deleteCertificateFiles(certificate);

    // Remove from database
    await this.sslCertificateRepository.remove(certificate);
  }

  async getStats() {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

    const [total, valid, expiring, expired] = await Promise.all([
      this.sslCertificateRepository.count(),
      this.sslCertificateRepository.count({
        where: { status: CertificateStatus.VALID }
      }),
      this.sslCertificateRepository.count({
        where: {
          status: CertificateStatus.VALID,
          expiresAt: LessThan(thirtyDaysFromNow),
        },
      }),
      this.sslCertificateRepository.count({
        where: { status: CertificateStatus.EXPIRED }
      }),
    ]);

    return {
      total,
      valid,
      expiring,
      expired,
    };
  }

  async renewCertificate(id: string): Promise<{ success: boolean; message: string }> {
    const certificate = await this.findOne(id);

    try {
      // Set certificate as pending renewal
      certificate.status = CertificateStatus.PENDING;
      await this.sslCertificateRepository.save(certificate);

      // Call ACME renewal method
      const renewalResult = await this.renewCertificateWithAcme(certificate);

      // Update certificate with new data
      certificate.status = CertificateStatus.VALID;
      certificate.expiresAt = renewalResult.expiresAt;
      certificate.certificatePath = renewalResult.certificatePath;
      certificate.privateKeyPath = renewalResult.privateKeyPath;
      certificate.lastError = null;

      await this.sslCertificateRepository.save(certificate);

      return {
        success: true,
        message: 'Certificado renovado com sucesso',
      };
    } catch (error) {
      certificate.status = CertificateStatus.FAILED;
      certificate.lastError = error.message;
      await this.sslCertificateRepository.save(certificate);

      return {
        success: false,
        message: `Erro na renovação: ${error.message}`,
      };
    }
  }

  private async renewCertificateWithAcme(certificate: SslCertificate): Promise<{
    certificatePath: string;
    privateKeyPath: string;
    expiresAt: Date;
  }> {
    // TODO: Implement ACME client logic for certificate renewal
    // For now, simulate the renewal process
    const basePath = `/ssl/${certificate.primaryDomain}`;

    return {
      certificatePath: `${basePath}.crt`,
      privateKeyPath: `${basePath}.key`,
      expiresAt: new Date(Date.now() + (90 * 24 * 60 * 60 * 1000)), // 90 days
    };
  }

  private async issueNewCertificate(domain: string, sanDomains?: string[]): Promise<{
    certificatePath: string;
    privateKeyPath: string;
    expiresAt: Date;
  }> {
    // TODO: Implement ACME client logic for new certificate issuance
    // For now, simulate the issuance process
    const basePath = `/ssl/${domain}`;

    return {
      certificatePath: `${basePath}.crt`,
      privateKeyPath: `${basePath}.key`,
      expiresAt: new Date(Date.now() + (90 * 24 * 60 * 60 * 1000)), // 90 days
    };
  }

  private async deleteCertificateFiles(certificate: SslCertificate): Promise<void> {
    // TODO: Implement file system cleanup
    // Remove certificate and private key files from disk
    console.log(`Deleting certificate files for ${certificate.primaryDomain}`);
  }

  async renewExpiredCertificates(): Promise<{ success: boolean; renewed: number; failed: number }> {
    const expiredCertificates = await this.sslCertificateRepository.find({
      where: [
        { status: CertificateStatus.EXPIRED },
        { status: CertificateStatus.EXPIRING },
      ],
    });

    let renewed = 0;
    let failed = 0;

    for (const cert of expiredCertificates) {
      const result = await this.renewCertificate(cert.id);
      if (result.success) {
        renewed++;
      } else {
        failed++;
      }
    }

    return {
      success: true,
      renewed,
      failed,
    };
  }
}