import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AppModule } from '../../src/app.module';
import { User } from '../../src/entities/user.entity';
import { Domain } from '../../src/entities/domain.entity';
import { ProxyRule } from '../../src/entities/proxy-rule.entity';
import { SslCertificate } from '../../src/entities/ssl-certificate.entity';

describe('NetPilot E2E Tests', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let domainRepository: Repository<Domain>;
  let proxyRuleRepository: Repository<ProxyRule>;
  let sslCertificateRepository: Repository<SslCertificate>;

  let accessToken: string;
  let adminUser: any;
  let testDomain: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        AppModule,
      ],
    })
      .overrideModule(TypeOrmModule)
      .useModule(
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('DB_HOST', 'localhost'),
            port: configService.get('DB_PORT', 5433),
            username: configService.get('DB_USER', 'netpilot_test'),
            password: configService.get('DB_PASS', 'test_password'),
            database: configService.get('DB_NAME', 'netpilot_test'),
            entities: [User, Domain, ProxyRule, SslCertificate],
            synchronize: true,
            dropSchema: true,
          }),
        })
      )
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    domainRepository = moduleFixture.get<Repository<Domain>>(getRepositoryToken(Domain));
    proxyRuleRepository = moduleFixture.get<Repository<ProxyRule>>(getRepositoryToken(ProxyRule));
    sslCertificateRepository = moduleFixture.get<Repository<SslCertificate>>(
      getRepositoryToken(SslCertificate)
    );
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean all tables
    await sslCertificateRepository.clear();
    await proxyRuleRepository.clear();
    await domainRepository.clear();
    await userRepository.clear();

    // Create admin user and get access token
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'admin@netpilot.local',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin',
      });

    adminUser = registerResponse.body;

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@netpilot.local',
        password: 'admin123',
      });

    accessToken = loginResponse.body.access_token;
  });

  describe('Complete Domain Management Workflow', () => {
    it('should complete full domain lifecycle', async () => {
      // 1. Create domain
      const createDomainResponse = await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          domain: 'example.com',
          enabled: true,
          description: 'Test domain for E2E testing',
        })
        .expect(201);

      testDomain = createDomainResponse.body;
      expect(testDomain.domain).toBe('example.com');

      // 2. List domains
      const listDomainsResponse = await request(app.getHttpServer())
        .get('/domains')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(listDomainsResponse.body.data).toHaveLength(1);
      expect(listDomainsResponse.body.data[0].domain).toBe('example.com');

      // 3. Get domain details
      const getDomainResponse = await request(app.getHttpServer())
        .get(`/domains/${testDomain.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(getDomainResponse.body).toMatchObject({
        id: testDomain.id,
        domain: 'example.com',
        enabled: true,
        proxyRules: [],
        redirects: [],
        sslCertificate: null,
      });

      // 4. Update domain
      const updateDomainResponse = await request(app.getHttpServer())
        .put(`/domains/${testDomain.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          description: 'Updated test domain',
          enabled: false,
        })
        .expect(200);

      expect(updateDomainResponse.body.description).toBe('Updated test domain');
      expect(updateDomainResponse.body.enabled).toBe(false);

      // 5. Toggle domain status
      const toggleResponse = await request(app.getHttpServer())
        .patch(`/domains/${testDomain.id}/toggle`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(toggleResponse.body.enabled).toBe(true);

      // 6. Delete domain
      await request(app.getHttpServer())
        .delete(`/domains/${testDomain.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      // 7. Verify domain is deleted
      await request(app.getHttpServer())
        .get(`/domains/${testDomain.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('Proxy Rules Management Workflow', () => {
    beforeEach(async () => {
      // Create test domain first
      const domainResponse = await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          domain: 'api.example.com',
          enabled: true,
        });

      testDomain = domainResponse.body;
    });

    it('should manage proxy rules lifecycle', async () => {
      // 1. Create proxy rule
      const createRuleResponse = await request(app.getHttpServer())
        .post('/proxy-rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          domainId: testDomain.id,
          sourcePath: '/api',
          targetUrl: 'http://localhost:3001',
          enabled: true,
          loadBalancingMethod: 'round_robin',
          healthCheckUrl: 'http://localhost:3001/health',
        })
        .expect(201);

      const proxyRule = createRuleResponse.body;
      expect(proxyRule.sourcePath).toBe('/api');
      expect(proxyRule.targetUrl).toBe('http://localhost:3001');

      // 2. List proxy rules
      const listRulesResponse = await request(app.getHttpServer())
        .get('/proxy-rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ domainId: testDomain.id })
        .expect(200);

      expect(listRulesResponse.body.data).toHaveLength(1);

      // 3. Update proxy rule
      const updateRuleResponse = await request(app.getHttpServer())
        .put(`/proxy-rules/${proxyRule.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          targetUrl: 'http://localhost:3002',
          loadBalancingMethod: 'least_connections',
        })
        .expect(200);

      expect(updateRuleResponse.body.targetUrl).toBe('http://localhost:3002');
      expect(updateRuleResponse.body.loadBalancingMethod).toBe('least_connections');

      // 4. Test proxy rule
      const testRuleResponse = await request(app.getHttpServer())
        .post(`/proxy-rules/${proxyRule.id}/test`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(testRuleResponse.body).toHaveProperty('success');
      expect(testRuleResponse.body).toHaveProperty('responseTimeMs');

      // 5. Apply proxy configuration
      const applyConfigResponse = await request(app.getHttpServer())
        .post('/proxy-rules/apply')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(applyConfigResponse.body.message).toContain('Configuration applied');
      expect(applyConfigResponse.body.appliedRules).toBe(1);

      // 6. Delete proxy rule
      await request(app.getHttpServer())
        .delete(`/proxy-rules/${proxyRule.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });
  });

  describe('SSL Certificate Management Workflow', () => {
    beforeEach(async () => {
      // Create test domain
      const domainResponse = await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          domain: 'secure.example.com',
          enabled: true,
        });

      testDomain = domainResponse.body;
    });

    it('should manage SSL certificates lifecycle', async () => {
      // 1. Generate SSL certificate
      const generateCertResponse = await request(app.getHttpServer())
        .post('/ssl-certificates')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          domainId: testDomain.id,
          provider: 'letsencrypt',
          challengeType: 'http-01',
          autoRenew: true,
        })
        .expect(201);

      const certificate = generateCertResponse.body;
      expect(certificate.status).toBe('pending');
      expect(certificate.provider).toBe('letsencrypt');

      // 2. List SSL certificates
      const listCertsResponse = await request(app.getHttpServer())
        .get('/ssl-certificates')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ domainId: testDomain.id })
        .expect(200);

      expect(listCertsResponse.body.data).toHaveLength(1);

      // 3. Get certificate details
      const getCertResponse = await request(app.getHttpServer())
        .get(`/ssl-certificates/${certificate.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(getCertResponse.body).toMatchObject({
        id: certificate.id,
        domainId: testDomain.id,
        provider: 'letsencrypt',
        autoRenew: true,
      });

      // 4. Check expiring certificates
      const checkExpiringResponse = await request(app.getHttpServer())
        .get('/ssl-certificates/check-expiration')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ days: 30 })
        .expect(200);

      expect(checkExpiringResponse.body).toHaveProperty('expiringCertificates');
      expect(checkExpiringResponse.body).toHaveProperty('totalExpiring');

      // 5. Verify certificate (would fail in test environment)
      const verifyResponse = await request(app.getHttpServer())
        .post(`/ssl-certificates/${certificate.id}/verify`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(verifyResponse.body).toHaveProperty('valid');

      // 6. Delete certificate
      await request(app.getHttpServer())
        .delete(`/ssl-certificates/${certificate.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });
  });

  describe('Dashboard and System Monitoring', () => {
    beforeEach(async () => {
      // Create test data
      const domain1Response = await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          domain: 'site1.com',
          enabled: true,
        });

      const domain2Response = await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          domain: 'site2.com',
          enabled: false,
        });

      // Create proxy rules
      await request(app.getHttpServer())
        .post('/proxy-rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          domainId: domain1Response.body.id,
          sourcePath: '/',
          targetUrl: 'http://localhost:3000',
          enabled: true,
        });
    });

    it('should provide dashboard statistics', async () => {
      const statsResponse = await request(app.getHttpServer())
        .get('/dashboard/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ period: '24h' })
        .expect(200);

      expect(statsResponse.body).toMatchObject({
        period: '24h',
        domains: {
          total: 2,
          active: 1,
          inactive: 1,
        },
        proxyRules: {
          total: 1,
          active: 1,
          inactive: 0,
        },
        sslCertificates: {
          total: 0,
          active: 0,
          expired: 0,
        },
      });
    });

    it('should provide traffic analytics', async () => {
      const trafficResponse = await request(app.getHttpServer())
        .get('/dashboard/traffic')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ period: '24h', groupBy: 'hour' })
        .expect(200);

      expect(trafficResponse.body).toMatchObject({
        period: '24h',
        groupBy: 'hour',
        data: expect.any(Array),
      });
    });

    it('should provide system status', async () => {
      const statusResponse = await request(app.getHttpServer())
        .get('/system/status')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(statusResponse.body).toMatchObject({
        system: {
          hostname: expect.any(String),
          platform: expect.any(String),
          uptime: expect.any(Number),
        },
        application: {
          version: expect.any(String),
          environment: expect.any(String),
        },
        resources: {
          cpu: expect.objectContaining({
            usagePercentage: expect.any(Number),
          }),
          memory: expect.objectContaining({
            usagePercentage: expect.any(Number),
          }),
        },
      });
    });
  });

  describe('Logs and Audit Trail', () => {
    it('should track user actions in logs', async () => {
      // Perform some actions
      await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          domain: 'logged.example.com',
          enabled: true,
        });

      // Check logs
      const logsResponse = await request(app.getHttpServer())
        .get('/logs')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ level: 'info', limit: 10 })
        .expect(200);

      expect(logsResponse.body.data).toBeDefined();
      expect(Array.isArray(logsResponse.body.data)).toBe(true);

      // Should contain domain creation log
      const domainCreationLog = logsResponse.body.data.find(
        (log: any) => log.message.includes('Domain created') && log.context?.domain === 'logged.example.com'
      );
      expect(domainCreationLog).toBeDefined();
    });

    it('should provide system logs', async () => {
      const systemLogsResponse = await request(app.getHttpServer())
        .get('/logs/system')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ service: 'backend', lines: 50 })
        .expect(200);

      expect(systemLogsResponse.body.data).toBeDefined();
      expect(Array.isArray(systemLogsResponse.body.data)).toBe(true);
    });
  });

  describe('Health Checks', () => {
    it('should provide health check endpoint', async () => {
      const healthResponse = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(healthResponse.body).toMatchObject({
        status: 'ok',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        version: expect.any(String),
        checks: {
          database: {
            status: 'ok',
            responseTimeMs: expect.any(Number),
          },
        },
      });
    });
  });

  describe('Authentication Flow Integration', () => {
    it('should enforce authentication across all endpoints', async () => {
      // Test that protected endpoints require authentication
      const protectedEndpoints = [
        { method: 'get', path: '/domains' },
        { method: 'post', path: '/domains' },
        { method: 'get', path: '/proxy-rules' },
        { method: 'get', path: '/ssl-certificates' },
        { method: 'get', path: '/dashboard/stats' },
        { method: 'get', path: '/logs' },
      ];

      for (const endpoint of protectedEndpoints) {
        await request(app.getHttpServer())
          [endpoint.method](endpoint.path)
          .expect(401);
      }
    });

    it('should handle token expiration gracefully', async () => {
      // This would require manipulating JWT expiration times
      // For now, we test with an obviously invalid token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxNjAwMDAwMDAwfQ.invalid';

      await request(app.getHttpServer())
        .get('/domains')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
  });

  describe('Data Validation and Constraints', () => {
    it('should enforce domain uniqueness across users', async () => {
      // Create domain with first user
      await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          domain: 'unique.example.com',
          enabled: true,
        })
        .expect(201);

      // Try to create same domain (should fail due to uniqueness constraint)
      await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          domain: 'unique.example.com',
          enabled: true,
        })
        .expect(409);
    });

    it('should validate domain name formats', async () => {
      const invalidDomains = [
        'invalid..domain',
        '.example.com',
        'example.com.',
        'http://example.com',
        'example',
        '',
      ];

      for (const domain of invalidDomains) {
        await request(app.getHttpServer())
          .post('/domains')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            domain,
            enabled: true,
          })
          .expect(422);
      }
    });

    it('should validate proxy rule configurations', async () => {
      const domainResponse = await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          domain: 'valid.example.com',
          enabled: true,
        });

      const invalidConfigurations = [
        {
          domainId: domainResponse.body.id,
          sourcePath: 'invalid-path', // Should start with /
          targetUrl: 'http://localhost:3001',
        },
        {
          domainId: domainResponse.body.id,
          sourcePath: '/api',
          targetUrl: 'invalid-url', // Invalid URL format
        },
        {
          domainId: 999999, // Non-existent domain
          sourcePath: '/api',
          targetUrl: 'http://localhost:3001',
        },
      ];

      for (const config of invalidConfigurations) {
        await request(app.getHttpServer())
          .post('/proxy-rules')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(config)
          .expect(422);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle non-existent resource requests', async () => {
      const nonExistentIds = [999999, -1, 0];

      for (const id of nonExistentIds) {
        await request(app.getHttpServer())
          .get(`/domains/${id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(404);

        await request(app.getHttpServer())
          .get(`/proxy-rules/${id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(404);

        await request(app.getHttpServer())
          .get(`/ssl-certificates/${id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(404);
      }
    });

    it('should handle malformed request bodies', async () => {
      await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${accessToken}`)
        .send('invalid json')
        .expect(400);
    });

    it('should handle large request payloads gracefully', async () => {
      const largeDescription = 'a'.repeat(10000); // Very long description

      await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          domain: 'large.example.com',
          enabled: true,
          description: largeDescription,
        })
        .expect(422); // Should fail validation due to length
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent requests', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        request(app.getHttpServer())
          .post('/domains')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            domain: `concurrent${i}.example.com`,
            enabled: true,
          })
      );

      const responses = await Promise.all(promises);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Verify all domains were created
      const listResponse = await request(app.getHttpServer())
        .get('/domains')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ limit: 20 });

      expect(listResponse.body.data).toHaveLength(10);
    });

    it('should handle pagination correctly with large datasets', async () => {
      // Create 25 domains
      const domainPromises = Array.from({ length: 25 }, (_, i) =>
        request(app.getHttpServer())
          .post('/domains')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            domain: `paginated${i}.example.com`,
            enabled: i % 2 === 0,
          })
      );

      await Promise.all(domainPromises);

      // Test pagination
      const page1Response = await request(app.getHttpServer())
        .get('/domains')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(page1Response.body.data).toHaveLength(10);
      expect(page1Response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      });

      const page2Response = await request(app.getHttpServer())
        .get('/domains')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ page: 2, limit: 10 })
        .expect(200);

      expect(page2Response.body.data).toHaveLength(10);
      expect(page2Response.body.pagination.page).toBe(2);

      const page3Response = await request(app.getHttpServer())
        .get('/domains')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ page: 3, limit: 10 })
        .expect(200);

      expect(page3Response.body.data).toHaveLength(5);
      expect(page3Response.body.pagination.page).toBe(3);
    });
  });
});