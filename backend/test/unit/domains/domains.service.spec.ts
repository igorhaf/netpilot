import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';

import { DomainsService } from '../../../src/modules/domains/domains.service';
import { Domain } from '../../../src/entities/domain.entity';
import { CreateDomainDto, UpdateDomainDto } from '../../../src/dtos/domain.dto';
import { ConfigGenerationService } from '../../../src/services/config-generation.service';

describe('DomainsService', () => {
  let service: DomainsService;
  let domainRepository: jest.Mocked<Repository<Domain>>;
  let configGenerationService: jest.Mocked<ConfigGenerationService>;

  const mockDomain: Domain = {
    id: 'domain-1',
    name: 'example.com',
    description: 'Test domain',
    isActive: true,
    isLocked: false,
    autoTls: true,
    forceHttps: true,
    blockExternalAccess: false,
    enableWwwRedirect: false,
    bindIp: '127.0.0.1',
    project: undefined,
    projectId: undefined,
    proxyRules: [],
    // redirects: [], // Temporarily disabled
    sslCertificates: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockDomainRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      remove: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockDomain]),
        getManyAndCount: jest.fn(),
      }),
    };

    const mockConfigGenerationService = {
      generateNginxConfig: jest.fn(),
      generateTraefikConfig: jest.fn(),
      reloadNginx: jest.fn(),
      reloadTraefik: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DomainsService,
        {
          provide: getRepositoryToken(Domain),
          useValue: mockDomainRepository,
        },
        {
          provide: ConfigGenerationService,
          useValue: mockConfigGenerationService,
        },
      ],
    }).compile();

    service = module.get<DomainsService>(DomainsService);
    domainRepository = module.get(getRepositoryToken(Domain));
    configGenerationService = module.get(ConfigGenerationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDomainDto: CreateDomainDto = {
      name: 'newdomain.com',
      description: 'New test domain',
      isActive: true,
      autoTls: true,
      forceHttps: true,
    };

    it('should create a domain successfully', async () => {
      const newDomain = {
        ...mockDomain,
        ...createDomainDto,
        id: 'domain-2',
      };

      domainRepository.findOne.mockResolvedValue(null);
      domainRepository.create.mockReturnValue(newDomain);
      domainRepository.save.mockResolvedValue(newDomain);
      configGenerationService.generateNginxConfig.mockResolvedValue(undefined);
      configGenerationService.generateTraefikConfig.mockResolvedValue(undefined);

      const result = await service.create(createDomainDto);

      expect(domainRepository.findOne).toHaveBeenCalledWith({
        where: { name: createDomainDto.name },
      });
      expect(domainRepository.create).toHaveBeenCalledWith(createDomainDto);
      expect(domainRepository.save).toHaveBeenCalledWith(newDomain);
      expect(configGenerationService.generateNginxConfig).toHaveBeenCalled();
      expect(configGenerationService.generateTraefikConfig).toHaveBeenCalled();
      expect(result).toEqual(newDomain);
    });

    it('should throw ConflictException if domain already exists', async () => {
      domainRepository.findOne.mockResolvedValue(mockDomain);

      await expect(service.create(createDomainDto)).rejects.toThrow(ConflictException);
      expect(domainRepository.findOne).toHaveBeenCalledWith({
        where: { name: createDomainDto.name },
      });
    });
  });

  describe('findAll', () => {
    it('should return all domains', async () => {
      const domains = [mockDomain];

      const result = await service.findAll();

      expect(domainRepository.createQueryBuilder).toHaveBeenCalledWith('domain');
      expect(result).toEqual(domains);
    });

    it('should handle search filtering', async () => {
      const domains = [mockDomain];

      const result = await service.findAll('example');

      expect(domainRepository.createQueryBuilder).toHaveBeenCalledWith('domain');
      expect(result).toEqual(domains);
    });
  });

  describe('findOne', () => {
    it('should return domain if found', async () => {
      const domainId = 'domain-1';
      domainRepository.findOne.mockResolvedValue(mockDomain);

      const result = await service.findOne(domainId);

      expect(domainRepository.findOne).toHaveBeenCalledWith({
        where: { id: domainId },
        relations: ['proxyRules', 'redirects', 'sslCertificates'],
      });
      expect(result).toEqual(mockDomain);
    });

    it('should throw NotFoundException if domain not found', async () => {
      const domainId = 'nonexistent';
      domainRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(domainId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDomainDto: UpdateDomainDto = {
      name: 'example.com',
      description: 'Updated description',
      isActive: false,
    };

    it('should update domain successfully', async () => {
      const domainId = 'domain-1';
      const updatedDomain = { ...mockDomain, ...updateDomainDto };

      domainRepository.findOne.mockResolvedValue(mockDomain);
      domainRepository.save.mockResolvedValue(updatedDomain);
      configGenerationService.generateNginxConfig.mockResolvedValue(undefined);
      configGenerationService.generateTraefikConfig.mockResolvedValue(undefined);

      const result = await service.update(domainId, updateDomainDto);

      expect(domainRepository.findOne).toHaveBeenCalledWith({
        where: { id: domainId },
        relations: ['proxyRules', 'redirects', 'sslCertificates'],
      });
      expect(configGenerationService.generateNginxConfig).toHaveBeenCalled();
      expect(configGenerationService.generateTraefikConfig).toHaveBeenCalled();
      expect(result).toEqual(updatedDomain);
    });

    it('should throw NotFoundException if domain not found', async () => {
      const domainId = 'nonexistent';
      domainRepository.findOne.mockResolvedValue(null);

      await expect(service.update(domainId, updateDomainDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove domain successfully', async () => {
      const domainId = 'domain-1';
      domainRepository.findOne.mockResolvedValue(mockDomain);
      domainRepository.remove.mockResolvedValue(mockDomain);
      configGenerationService.generateNginxConfig.mockResolvedValue(undefined);
      configGenerationService.generateTraefikConfig.mockResolvedValue(undefined);

      await service.remove(domainId);

      expect(domainRepository.findOne).toHaveBeenCalledWith({
        where: { id: domainId },
        relations: ['proxyRules', 'redirects', 'sslCertificates'],
      });
      expect(domainRepository.remove).toHaveBeenCalledWith(mockDomain);
      expect(configGenerationService.generateNginxConfig).toHaveBeenCalled();
      expect(configGenerationService.generateTraefikConfig).toHaveBeenCalled();
    });

    it('should throw NotFoundException if domain not found', async () => {
      const domainId = 'nonexistent';
      domainRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(domainId)).rejects.toThrow(NotFoundException);
    });
  });
});