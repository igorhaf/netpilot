import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';

import { SslCertificatesService } from '../../../src/modules/ssl-certificates/ssl-certificates.service';
import { SslCertificate, CertificateStatus } from '../../../src/entities/ssl-certificate.entity';
import { CreateSslCertificateDto, UpdateSslCertificateDto } from '../../../src/dtos/ssl-certificate.dto';

type MockRepository<T = {}> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('SslCertificatesService', () => {
  let service: SslCertificatesService;
  let sslCertificateRepository: MockRepository<SslCertificate>;

  const mockSslCertificate: Partial<SslCertificate> = {
    id: 'cert-1',
    primaryDomain: 'example.com',
    sanDomains: ['www.example.com'],
    status: CertificateStatus.VALID,
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    autoRenew: true,
    renewBeforeDays: 30,
    certificatePath: '/ssl/example.com.crt',
    privateKeyPath: '/ssl/example.com.key',
    issuer: 'Let\'s Encrypt',
    lastError: null,
    domain: {
      id: 'domain-1',
      name: 'example.com',
      enabled: true,
      autoTls: true,
      forceHttps: true,
      description: 'Test domain',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any,
    domainId: 'domain-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SslCertificatesService,
        {
          provide: getRepositoryToken(SslCertificate),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SslCertificatesService>(SslCertificatesService);
    sslCertificateRepository = module.get<MockRepository<SslCertificate>>(
      getRepositoryToken(SslCertificate),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all SSL certificates with domain relations', async () => {
      sslCertificateRepository.find.mockResolvedValue([mockSslCertificate]);

      const result = await service.findAll();

      expect(sslCertificateRepository.find).toHaveBeenCalledWith({
        relations: ['domain'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockSslCertificate]);
    });
  });

  describe('findOne', () => {
    it('should return an SSL certificate by id', async () => {
      sslCertificateRepository.findOne.mockResolvedValue(mockSslCertificate);

      const result = await service.findOne('cert-1');

      expect(sslCertificateRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'cert-1' },
        relations: ['domain'],
      });
      expect(result).toEqual(mockSslCertificate);
    });

    it('should throw NotFoundException if certificate not found', async () => {
      sslCertificateRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto: CreateSslCertificateDto = {
      primaryDomain: 'example.com',
      domainId: 'test-domain-id',
      sanDomains: ['www.example.com'],
      autoRenew: true,
    };

    it('should create a new SSL certificate successfully', async () => {
      const newCertificate = { ...mockSslCertificate, ...createDto, id: 'cert-2' };

      sslCertificateRepository.findOne.mockResolvedValue(null); // No existing cert
      sslCertificateRepository.create.mockReturnValue(newCertificate as any);
      sslCertificateRepository.save.mockResolvedValue(newCertificate as any);

      const result = await service.create(createDto);

      expect(sslCertificateRepository.create).toHaveBeenCalledWith(createDto);
      expect(sslCertificateRepository.save).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        primaryDomain: createDto.primaryDomain,
        domainId: createDto.domainId,
      }));
    });

    it('should throw BadRequestException if certificate already exists', async () => {
      sslCertificateRepository.findOne.mockResolvedValue(mockSslCertificate);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });

    it('should validate domain name format', async () => {
      const invalidDto = {
        ...createDto,
        primaryDomain: 'invalid..domain.com',
      };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateSslCertificateDto = {
      primaryDomain: 'updated.com',
      domainId: 'domain-1',
      autoRenew: false,
    };

    it('should update an SSL certificate successfully', async () => {
      const updatedCertificate = { ...mockSslCertificate, ...updateDto };

      sslCertificateRepository.findOne.mockResolvedValue(mockSslCertificate);
      sslCertificateRepository.save.mockResolvedValue(updatedCertificate);

      const result = await service.update('cert-1', updateDto);

      expect(result).toEqual(updatedCertificate);
    });

    it('should throw NotFoundException if certificate not found', async () => {
      sslCertificateRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an SSL certificate successfully', async () => {
      sslCertificateRepository.findOne.mockResolvedValue(mockSslCertificate);
      sslCertificateRepository.remove.mockResolvedValue(mockSslCertificate);

      await service.remove('cert-1');

      expect(sslCertificateRepository.remove).toHaveBeenCalledWith(mockSslCertificate);
    });

    it('should throw NotFoundException if certificate not found', async () => {
      sslCertificateRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('renewCertificate', () => {
    it('should renew an SSL certificate successfully', async () => {
      sslCertificateRepository.findOne.mockResolvedValue(mockSslCertificate);
      sslCertificateRepository.save.mockResolvedValue({
        ...mockSslCertificate,
        status: CertificateStatus.VALID,
      });

      const result = await service.renewCertificate('cert-1');

      expect(result).toEqual({
        success: true,
        message: 'Certificado renovado com sucesso',
      });
    });

    it('should throw NotFoundException if certificate not found', async () => {
      sslCertificateRepository.findOne.mockResolvedValue(null);

      await expect(service.renewCertificate('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('renewExpiredCertificates', () => {
    it('should renew all expired and expiring certificates', async () => {
      const expiredCerts = [
        { ...mockSslCertificate, id: 'cert-1', status: CertificateStatus.EXPIRED },
        { ...mockSslCertificate, id: 'cert-2', status: CertificateStatus.EXPIRING },
      ];

      sslCertificateRepository.find.mockResolvedValue(expiredCerts);
      jest.spyOn(service, 'renewCertificate')
        .mockResolvedValue({ success: true, message: 'Renewed' });

      const result = await service.renewExpiredCertificates();

      expect(sslCertificateRepository.find).toHaveBeenCalledWith({
        where: [
          { status: CertificateStatus.EXPIRED },
          { status: CertificateStatus.EXPIRING },
        ],
      });
      expect(result).toEqual({
        success: true,
        renewed: 2,
        failed: 0,
      });
    });

    it('should handle partial renewal failures', async () => {
      const expiredCerts = [
        { ...mockSslCertificate, id: 'cert-1', status: CertificateStatus.EXPIRED },
        { ...mockSslCertificate, id: 'cert-2', status: CertificateStatus.EXPIRING },
      ];

      sslCertificateRepository.find.mockResolvedValue(expiredCerts);
      jest.spyOn(service, 'renewCertificate')
        .mockResolvedValueOnce({ success: true, message: 'Renewed' })
        .mockResolvedValueOnce({ success: false, message: 'Failed' });

      const result = await service.renewExpiredCertificates();

      expect(result).toEqual({
        success: true,
        renewed: 1,
        failed: 1,
      });
    });
  });

  describe('getStats', () => {
    it('should return certificate statistics', async () => {
      sslCertificateRepository.count.mockImplementation((options?: any) => {
        if (!options) return Promise.resolve(10);
        if (options.where?.status === 'valid') return Promise.resolve(7);
        if (options.where?.status === 'expired') return Promise.resolve(1);
        if (options.where?.expiresAt) return Promise.resolve(2);
        return Promise.resolve(0);
      });

      const result = await service.getStats();

      expect(result).toEqual({
        total: 10,
        valid: 7,
        expiring: 2,
        expired: 1,
      });
    });
  });
});