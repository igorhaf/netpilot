import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';

import { ProxyRulesService } from '../../../src/modules/proxy-rules/proxy-rules.service';
import { ProxyRule } from '../../../src/entities/proxy-rule.entity';
import { Domain } from '../../../src/entities/domain.entity';
import { CreateProxyRuleDto, UpdateProxyRuleDto } from '../../../src/dtos/proxy-rule.dto';
import { ConfigGenerationService } from '../../../src/services/config-generation.service';

describe('ProxyRulesService', () => {
  let service: ProxyRulesService;
  let proxyRuleRepository: jest.Mocked<Repository<ProxyRule>>;
  let domainRepository: jest.Mocked<Repository<Domain>>;
  let configService: jest.Mocked<ConfigGenerationService>;

  const mockDomain = {
    id: 'domain-1',
    name: 'example.com',
    description: 'Test domain',
    enabled: true,
    autoTls: true,
    forceHttps: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProxyRule = {
    id: 'rule-1',
    domainId: 'domain-1',
    originPath: '/api/*',
    destinationUrl: 'http://backend:3001',
    priority: 10,
    enabled: true,
    keepQueryStrings: true,
    domain: mockDomain,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockProxyRuleRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockDomainRepository = {
      findOne: jest.fn(),
    };

    const mockConfigService = {
      generateNginxConfig: jest.fn(),
      generateTraefikConfig: jest.fn(),
      applyConfiguration: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProxyRulesService,
        {
          provide: getRepositoryToken(ProxyRule),
          useValue: mockProxyRuleRepository,
        },
        {
          provide: getRepositoryToken(Domain),
          useValue: mockDomainRepository,
        },
        {
          provide: ConfigGenerationService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ProxyRulesService>(ProxyRulesService);
    proxyRuleRepository = module.get(getRepositoryToken(ProxyRule));
    domainRepository = module.get(getRepositoryToken(Domain));
    configService = module.get(ConfigGenerationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all proxy rules with relations', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockProxyRule]),
      };

      proxyRuleRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.findAll();

      expect(proxyRuleRepository.createQueryBuilder).toHaveBeenCalledWith('proxyRule');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('proxyRule.domain', 'domain');
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('proxyRule.priority', 'DESC');
      expect(result).toEqual([mockProxyRule]);
    });

    it('should filter by domain id', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockProxyRule]),
      };

      proxyRuleRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      await service.findAll('', '');

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('proxyRule.domainId = :domainId', {
        domainId: 'domain-1',
      });
    });

    it('should filter by enabled status', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockProxyRule]),
      };

      proxyRuleRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      await service.findAll('', 'active');

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('proxyRule.enabled = :enabled', {
        enabled: true,
      });
    });
  });

  describe('findOne', () => {
    it('should return a proxy rule by id', async () => {
      proxyRuleRepository.findOne.mockResolvedValue(mockProxyRule as any);

      const result = await service.findOne('rule-1');

      expect(proxyRuleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'rule-1' },
        relations: ['domain'],
      });
      expect(result).toEqual(mockProxyRule);
    });

    it('should throw NotFoundException if proxy rule not found', async () => {
      proxyRuleRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto: CreateProxyRuleDto = {
      domainId: 'domain-1',
      sourcePath: '/api/*',
      targetUrl: 'http://backend:3001',
      priority: 10,
      isActive: true,
      maintainQueryStrings: true,
    };

    it('should create a new proxy rule successfully', async () => {
      const newProxyRule = { ...mockProxyRule, ...createDto, id: 'rule-2' };

      domainRepository.findOne.mockResolvedValue(mockDomain as any);
      proxyRuleRepository.create.mockReturnValue(newProxyRule as any);
      proxyRuleRepository.save.mockResolvedValue(newProxyRule as any);
      configService.generateNginxConfig.mockResolvedValue(undefined);
      configService.generateTraefikConfig.mockResolvedValue(undefined);

      const result = await service.create(createDto);

      expect(domainRepository.findOne).toHaveBeenCalledWith({
        where: { id: createDto.domainId },
      });
      expect(proxyRuleRepository.create).toHaveBeenCalledWith(createDto);
      expect(proxyRuleRepository.save).toHaveBeenCalledWith(newProxyRule);
      expect(configService.generateNginxConfig).toHaveBeenCalled();
      expect(configService.generateTraefikConfig).toHaveBeenCalled();
      expect(result).toEqual(newProxyRule);
    });

    it('should throw NotFoundException if domain not found', async () => {
      domainRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      expect(domainRepository.findOne).toHaveBeenCalledWith({
        where: { id: createDto.domainId },
      });
    });

    it('should validate priority conflicts', async () => {
      const conflictingRule = { ...mockProxyRule, originPath: '/api/*', priority: 10 };

      domainRepository.findOne.mockResolvedValue(mockDomain as any);

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(conflictingRule),
      };
      proxyRuleRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateProxyRuleDto = {
      sourcePath: '/updated/*',
      targetUrl: 'http://backend:3002',
      priority: 20,
      isActive: false,
      domainId: 'domain-1',
    };

    it('should update a proxy rule successfully', async () => {
      const updatedProxyRule = { ...mockProxyRule, ...updateDto };

      proxyRuleRepository.findOne.mockResolvedValue(mockProxyRule as any);
      proxyRuleRepository.save.mockResolvedValue(updatedProxyRule as any);
      configService.generateNginxConfig.mockResolvedValue(undefined);
      configService.generateTraefikConfig.mockResolvedValue(undefined);

      const result = await service.update('rule-1', updateDto);

      expect(proxyRuleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'rule-1' },
        relations: ['domain'],
      });
      expect(proxyRuleRepository.save).toHaveBeenCalledWith({
        ...mockProxyRule,
        ...updateDto,
      });
      expect(configService.generateNginxConfig).toHaveBeenCalled();
      expect(configService.generateTraefikConfig).toHaveBeenCalled();
      expect(result).toEqual(updatedProxyRule);
    });

    it('should throw NotFoundException if proxy rule not found', async () => {
      proxyRuleRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a proxy rule successfully', async () => {
      proxyRuleRepository.findOne.mockResolvedValue(mockProxyRule as any);
      proxyRuleRepository.delete.mockResolvedValue({ affected: 1 } as any);
      configService.generateNginxConfig.mockResolvedValue(undefined);
      configService.generateTraefikConfig.mockResolvedValue(undefined);

      await service.remove('rule-1');

      expect(proxyRuleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'rule-1' },
        relations: ['domain'],
      });
      expect(proxyRuleRepository.delete).toHaveBeenCalledWith('rule-1');
      expect(configService.generateNginxConfig).toHaveBeenCalled();
      expect(configService.generateTraefikConfig).toHaveBeenCalled();
    });

    it('should throw NotFoundException if proxy rule not found', async () => {
      proxyRuleRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('applyConfiguration', () => {
    it('should apply configuration successfully', async () => {
      configService.generateNginxConfig.mockResolvedValue(undefined);
      configService.generateTraefikConfig.mockResolvedValue(undefined);

      await service.applyConfiguration();

      expect(configService.generateNginxConfig).toHaveBeenCalled();
      expect(configService.generateTraefikConfig).toHaveBeenCalled();
    });

    it('should handle configuration errors', async () => {
      const error = new Error('Configuration failed');
      configService.generateNginxConfig.mockRejectedValue(error);

      await expect(service.applyConfiguration()).rejects.toThrow('Configuration failed');
    });
  });

  describe('validateProxyRule', () => {
    it('should validate valid destination URLs', () => {
      const validUrls = [
        'http://backend:3001',
        'https://api.example.com',
        'http://172.18.0.1:8080',
        'https://subdomain.example.com:443/api',
      ];

      validUrls.forEach(url => {
        expect(() => service['validateDestinationUrl'](url)).not.toThrow();
      });
    });

    it('should reject invalid destination URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://example.com',
        'javascript:alert("xss")',
        'file:///etc/passwd',
        'data:text/html,<script>alert(1)</script>',
      ];

      invalidUrls.forEach(url => {
        expect(() => service['validateDestinationUrl'](url)).toThrow();
      });
    });

    it('should validate origin path patterns', () => {
      const validPaths = [
        '/',
        '/api',
        '/api/*',
        '/v1/users/**',
        '/static/*',
        '/app/*/config',
      ];

      validPaths.forEach(path => {
        expect(() => service['validateOriginPath'](path)).not.toThrow();
      });
    });

    it('should reject invalid origin paths', () => {
      const invalidPaths = [
        '',
        'api', // should start with /
        '/api/../etc/passwd',
        '/api/./secret',
        '//double-slash',
        '/api\\windows\\path',
      ];

      invalidPaths.forEach(path => {
        expect(() => service['validateOriginPath'](path)).toThrow();
      });
    });
  });
});