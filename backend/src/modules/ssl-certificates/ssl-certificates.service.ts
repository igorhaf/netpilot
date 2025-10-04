import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { SslCertificate, CertificateStatus } from '../../entities/ssl-certificate.entity';
import { CreateSslCertificateDto, UpdateSslCertificateDto } from '../../dtos/ssl-certificate.dto';

@Injectable()
export class SslCertificatesService {
  private readonly logger = new Logger(SslCertificatesService.name);
  private readonly systemOpsUrl: string;

  constructor(
    @InjectRepository(SslCertificate)
    private sslCertificateRepository: Repository<SslCertificate>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.systemOpsUrl = this.configService.get('SYSTEM_OPS_URL', 'http://localhost:8001');
  }

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

    try {
      this.logger.log(`📝 Solicitando emissão de certificado SSL ao Python service para ${createSslCertificateDto.primaryDomain}`);

      // Preparar request para Python service
      const allDomains = [createSslCertificateDto.primaryDomain];
      if (createSslCertificateDto.sanDomains?.length > 0) {
        allDomains.push(...createSslCertificateDto.sanDomains);
      }

      const sslRequest = {
        domains: allDomains,
        provider: 'letsencrypt',
        email: process.env.SSL_EMAIL || 'admin@netpilot.local',
        agree_tos: true,
        staging: process.env.ACME_STAGING === 'true',
        challenge_type: 'http-01',
        webroot_path: process.env.ACME_CHALLENGE_PATH || '/var/www/certbot'
      };

      // Chamar Python service para emitir certificado
      const response = await firstValueFrom(
        this.httpService.post(`${this.systemOpsUrl}/ssl/issue`, sslRequest, {
          timeout: 120000 // 2 minutos para ACME challenge
        })
      );

      if (response.data.success) {
        this.logger.log(`✅ Certificado SSL emitido com sucesso para ${createSslCertificateDto.primaryDomain}`);

        // Buscar certificado criado pelo Python service
        const certificate = await this.sslCertificateRepository.findOne({
          where: { id: response.data.certificate_id }
        });

        if (certificate) {
          return certificate;
        }
      }

      throw new Error(response.data.message || 'Erro ao emitir certificado');

    } catch (error) {
      this.logger.error(`❌ Erro ao comunicar com Python service: ${error.message}`);
      throw new BadRequestException(`Erro ao emitir certificado: ${error.message}`);
    }
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

    // Prevent updating locked certificates
    if (certificate.isLocked) {
      throw new BadRequestException('Não é possível atualizar um certificado travado');
    }

    Object.assign(certificate, updateSslCertificateDto);
    return await this.sslCertificateRepository.save(certificate);
  }

  async remove(id: string): Promise<void> {
    const certificate = await this.findOne(id);

    // Prevent removing locked certificates
    if (certificate.isLocked) {
      throw new BadRequestException('Não é possível remover um certificado travado');
    }

    // Delete certificate files from disk
    await this.deleteCertificateFiles(certificate);

    // Remove from database
    await this.sslCertificateRepository.remove(certificate);
  }

  async toggleLock(id: string): Promise<SslCertificate> {
    const certificate = await this.findOne(id);
    certificate.isLocked = !certificate.isLocked;
    await this.sslCertificateRepository.save(certificate);
    return this.findOne(id);
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

    // Prevent renewing locked certificates
    if (certificate.isLocked) {
      throw new BadRequestException('Não é possível renovar um certificado travado');
    }

    try {
      this.logger.log(`🔄 Solicitando renovação de certificado SSL ao Python service para ${certificate.primaryDomain}`);

      // Set certificate as pending renewal
      certificate.status = CertificateStatus.PENDING;
      await this.sslCertificateRepository.save(certificate);

      // Chamar Python service para renovar certificado
      const renewalRequest = {
        certificate_id: id,
        domains: [certificate.primaryDomain, ...(certificate.sanDomains || [])],
        force: false,
        days_before_expiry: 30
      };

      const response = await firstValueFrom(
        this.httpService.post(`${this.systemOpsUrl}/ssl/renew`, renewalRequest, {
          timeout: 120000 // 2 minutos para renovação
        })
      );

      if (response.data.success) {
        this.logger.log(`✅ Certificado SSL renovado com sucesso para ${certificate.primaryDomain}`);

        return {
          success: true,
          message: 'Certificado renovado com sucesso',
        };
      } else {
        throw new Error(response.data.message || 'Erro ao renovar certificado');
      }

    } catch (error) {
      this.logger.error(`❌ Erro ao renovar certificado: ${error.message}`);

      certificate.status = CertificateStatus.FAILED;
      certificate.lastError = error.message;
      await this.sslCertificateRepository.save(certificate);

      return {
        success: false,
        message: `Erro na renovação: ${error.message}`,
      };
    }
  }

  private async deleteCertificateFiles(certificate: SslCertificate): Promise<void> {
    // Certificados são gerenciados pelo Python service
    // Os arquivos físicos serão mantidos para histórico
    this.logger.log(`Marcando certificado como deletado: ${certificate.primaryDomain}`);
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