import { Injectable, NotFoundException } from '@nestjs/common';
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
    const certificate = this.sslCertificateRepository.create(createSslCertificateDto);
    return await this.sslCertificateRepository.save(certificate);
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
      // Here you would implement ACME client logic
      certificate.status = CertificateStatus.PENDING;
      await this.sslCertificateRepository.save(certificate);

      // Simulate certificate renewal
      setTimeout(async () => {
        certificate.status = CertificateStatus.VALID;
        certificate.expiresAt = new Date(Date.now() + (90 * 24 * 60 * 60 * 1000)); // 90 days
        await this.sslCertificateRepository.save(certificate);
      }, 2000);

      return {
        success: true,
        message: 'Renovação de certificado iniciada',
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