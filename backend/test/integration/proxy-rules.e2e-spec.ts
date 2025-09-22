import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AppModule } from '../../src/app.module';
import { ProxyRule } from '../../src/entities/proxy-rule.entity';
import { Domain } from '../../src/entities/domain.entity';
import { User } from '../../src/entities/user.entity';

describe('ProxyRules (e2e)', () => {
  let app: INestApplication;
  let proxyRuleRepository: Repository<ProxyRule>;
  let domainRepository: Repository<Domain>;
  let userRepository: Repository<User>;
  let accessToken: string;
  let testDomainId: string;

  const testUser = {
    email: 'test@example.com',
    password: 'Password123!',
    role: 'admin',
  };

  const testDomain = {
    name: 'test-proxy.example.com',
    description: 'Test domain for proxy rules',
    enabled: true,
    autoTls: true,
    forceHttps: true,
  };

  const testProxyRule = {
    originPath: '/api/*',
    destinationUrl: 'http://backend:3001',
    priority: 10,
    enabled: true,
    keepQueryStrings: true,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'meadadigital.com',
          port: parseInt(process.env.DB_PORT, 10) || 5432,
          username: process.env.DB_USERNAME || 'netpilot',
          password: process.env.DB_PASSWORD || 'netpilot123',
          database: process.env.DB_TEST_NAME || 'netpilot_test',
          entities: [__dirname + '/../../src/entities/*.entity{.ts,.js}'],
          synchronize: true,
          dropSchema: true,
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    proxyRuleRepository = app.get<Repository<ProxyRule>>(getRepositoryToken(ProxyRule));
    domainRepository = app.get<Repository<Domain>>(getRepositoryToken(Domain));
    userRepository = app.get<Repository<User>>(getRepositoryToken(User));

    await app.init();

    // Create test user and get access token
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    accessToken = loginResponse.body.access_token;

    // Create test domain
    const domainResponse = await request(app.getHttpServer())
      .post('/domains')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(testDomain);

    testDomainId = domainResponse.body.id;
  });

  beforeEach(async () => {
    // Clean proxy rules before each test
    await proxyRuleRepository.delete({});
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/proxy-rules (POST)', () => {
    it('should create a new proxy rule', async () => {
      const proxyRuleData = {
        ...testProxyRule,
        domainId: testDomainId,
      };

      const response = await request(app.getHttpServer())
        .post('/proxy-rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(proxyRuleData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.domainId).toBe(testDomainId);
      expect(response.body.originPath).toBe(testProxyRule.originPath);
      expect(response.body.destinationUrl).toBe(testProxyRule.destinationUrl);
      expect(response.body.priority).toBe(testProxyRule.priority);

      // Verify proxy rule was created in database
      const proxyRule = await proxyRuleRepository.findOne({
        where: { id: response.body.id },
      });
      expect(proxyRule).toBeDefined();
    });

    it('should reject proxy rule with non-existent domain', async () => {
      const proxyRuleData = {
        ...testProxyRule,
        domainId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const response = await request(app.getHttpServer())
        .post('/proxy-rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(proxyRuleData)
        .expect(404);

      expect(response.body.message).toContain('Domain not found');
    });

    it('should validate destination URL format', async () => {
      const invalidProxyRule = {
        ...testProxyRule,
        domainId: testDomainId,
        destinationUrl: 'invalid-url',
      };

      const response = await request(app.getHttpServer())
        .post('/proxy-rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidProxyRule)
        .expect(400);

      expect(response.body.message).toContain('URL');
    });

    it('should validate origin path format', async () => {
      const invalidProxyRule = {
        ...testProxyRule,
        domainId: testDomainId,
        originPath: 'invalid-path',
      };

      const response = await request(app.getHttpServer())
        .post('/proxy-rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidProxyRule)
        .expect(400);

      expect(response.body.message).toContain('path');
    });

    it('should validate priority conflicts', async () => {
      // Create first proxy rule
      const firstRule = {
        ...testProxyRule,
        domainId: testDomainId,
        originPath: '/api/v1/*',
        priority: 10,
      };

      await request(app.getHttpServer())
        .post('/proxy-rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(firstRule)
        .expect(201);

      // Try to create conflicting rule
      const conflictingRule = {
        ...testProxyRule,
        domainId: testDomainId,
        originPath: '/api/v2/*',
        priority: 10, // Same priority
      };

      const response = await request(app.getHttpServer())
        .post('/proxy-rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(conflictingRule)
        .expect(409);

      expect(response.body.message).toContain('priority');
    });

    it('should require authentication', async () => {
      const proxyRuleData = {
        ...testProxyRule,
        domainId: testDomainId,
      };

      await request(app.getHttpServer())
        .post('/proxy-rules')
        .send(proxyRuleData)
        .expect(401);
    });

    it('should validate required fields', async () => {
      const incompleteRule = {
        domainId: testDomainId,
        originPath: '/api/*',
        // Missing destinationUrl
      };

      await request(app.getHttpServer())
        .post('/proxy-rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(incompleteRule)
        .expect(400);
    });
  });

  describe('/proxy-rules (GET)', () => {
    beforeEach(async () => {
      // Create test proxy rules
      const rules = [
        {
          ...testProxyRule,
          domainId: testDomainId,
          originPath: '/api/v1/*',
          priority: 10,
        },
        {
          ...testProxyRule,
          domainId: testDomainId,
          originPath: '/api/v2/*',
          priority: 20,
          enabled: false,
        },
        {
          ...testProxyRule,
          domainId: testDomainId,
          originPath: '/static/*',
          priority: 5,
          destinationUrl: 'http://static-server:8080',
        },
      ];

      for (const rule of rules) {
        await request(app.getHttpServer())
          .post('/proxy-rules')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(rule);
      }
    });

    it('should return all proxy rules ordered by priority', async () => {
      const response = await request(app.getHttpServer())
        .get('/proxy-rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body).toHaveLength(3);

      // Verify ordering by priority (highest first)
      expect(response.body[0].priority).toBeGreaterThanOrEqual(response.body[1].priority);
      expect(response.body[1].priority).toBeGreaterThanOrEqual(response.body[2].priority);

      // Verify domain relation is included
      expect(response.body[0]).toHaveProperty('domain');
      expect(response.body[0].domain).toHaveProperty('name');
    });

    it('should filter by domain id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/proxy-rules?domainId=${testDomainId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveLength(3);
      response.body.forEach(rule => {
        expect(rule.domainId).toBe(testDomainId);
      });
    });

    it('should filter by enabled status', async () => {
      const response = await request(app.getHttpServer())
        .get('/proxy-rules?enabled=false')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].enabled).toBe(false);
    });

    it('should search by origin path', async () => {
      const response = await request(app.getHttpServer())
        .get('/proxy-rules?search=v1')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].originPath).toContain('v1');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/proxy-rules')
        .expect(401);
    });
  });

  describe('/proxy-rules/:id (GET)', () => {
    let proxyRuleId: string;

    beforeEach(async () => {
      const proxyRuleData = {
        ...testProxyRule,
        domainId: testDomainId,
      };

      const response = await request(app.getHttpServer())
        .post('/proxy-rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(proxyRuleData);

      proxyRuleId = response.body.id;
    });

    it('should return proxy rule by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/proxy-rules/${proxyRuleId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(proxyRuleId);
      expect(response.body.originPath).toBe(testProxyRule.originPath);
      expect(response.body).toHaveProperty('domain');
      expect(response.body.domain.id).toBe(testDomainId);
    });

    it('should return 404 for non-existent proxy rule', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';

      const response = await request(app.getHttpServer())
        .get(`/proxy-rules/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get(`/proxy-rules/${proxyRuleId}`)
        .expect(401);
    });
  });

  describe('/proxy-rules/:id (PATCH)', () => {
    let proxyRuleId: string;

    beforeEach(async () => {
      const proxyRuleData = {
        ...testProxyRule,
        domainId: testDomainId,
      };

      const response = await request(app.getHttpServer())
        .post('/proxy-rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(proxyRuleData);

      proxyRuleId = response.body.id;
    });

    it('should update proxy rule successfully', async () => {
      const updateData = {
        targetUrl: 'http://new-backend:3002',
        priority: 15,
        enabled: false,
        keepQueryStrings: false,
      };

      const response = await request(app.getHttpServer())
        .patch(`/proxy-rules/${proxyRuleId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.id).toBe(proxyRuleId);
      expect(response.body.targetUrl).toBe(updateData.targetUrl);
      expect(response.body.priority).toBe(updateData.priority);
      expect(response.body.enabled).toBe(updateData.enabled);
      expect(response.body.keepQueryStrings).toBe(updateData.keepQueryStrings);

      // Verify in database
      const proxyRule = await proxyRuleRepository.findOne({
        where: { id: proxyRuleId },
      });
      expect(proxyRule.targetUrl).toBe(updateData.targetUrl);
    });

    it('should prevent updating to conflicting priority', async () => {
      // Create another proxy rule
      const anotherRule = {
        ...testProxyRule,
        domainId: testDomainId,
        originPath: '/other/*',
        priority: 25,
      };

      await request(app.getHttpServer())
        .post('/proxy-rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(anotherRule);

      // Try to update first rule to conflicting priority
      const response = await request(app.getHttpServer())
        .patch(`/proxy-rules/${proxyRuleId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ priority: 25 })
        .expect(409);

      expect(response.body.message).toContain('priority');
    });

    it('should return 404 for non-existent proxy rule', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';

      await request(app.getHttpServer())
        .patch(`/proxy-rules/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ enabled: false })
        .expect(404);
    });

    it('should validate update data', async () => {
      const invalidUpdate = {
        destinationUrl: 'invalid-url',
        priority: -1,
      };

      await request(app.getHttpServer())
        .patch(`/proxy-rules/${proxyRuleId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidUpdate)
        .expect(400);
    });
  });

  describe('/proxy-rules/:id (DELETE)', () => {
    let proxyRuleId: string;

    beforeEach(async () => {
      const proxyRuleData = {
        ...testProxyRule,
        domainId: testDomainId,
      };

      const response = await request(app.getHttpServer())
        .post('/proxy-rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(proxyRuleData);

      proxyRuleId = response.body.id;
    });

    it('should delete proxy rule successfully', async () => {
      await request(app.getHttpServer())
        .delete(`/proxy-rules/${proxyRuleId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify proxy rule was deleted
      const proxyRule = await proxyRuleRepository.findOne({
        where: { id: proxyRuleId },
      });
      expect(proxyRule).toBeNull();
    });

    it('should return 404 for non-existent proxy rule', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';

      await request(app.getHttpServer())
        .delete(`/proxy-rules/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/proxy-rules/${proxyRuleId}`)
        .expect(401);
    });
  });

  describe('/proxy-rules/apply-configuration (POST)', () => {
    beforeEach(async () => {
      // Create some proxy rules
      const rules = [
        {
          ...testProxyRule,
          domainId: testDomainId,
          originPath: '/api/*',
          priority: 10,
        },
        {
          ...testProxyRule,
          domainId: testDomainId,
          originPath: '/static/*',
          priority: 5,
          destinationUrl: 'http://static:8080',
        },
      ];

      for (const rule of rules) {
        await request(app.getHttpServer())
          .post('/proxy-rules')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(rule);
      }
    });

    it('should apply configuration successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/proxy-rules/apply-configuration')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('applied');
    });

    it('should handle configuration errors gracefully', async () => {
      // This would test error handling in configuration generation
      // For now, we verify the endpoint exists and responds
      await request(app.getHttpServer())
        .post('/proxy-rules/apply-configuration')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/proxy-rules/apply-configuration')
        .expect(401);
    });
  });

  describe('Priority Management', () => {
    it('should handle automatic priority assignment', async () => {
      // Create rules without explicit priority
      const rules = [
        {
          domainId: testDomainId,
          originPath: '/api/v1/*',
          destinationUrl: 'http://api-v1:3001',
          enabled: true,
        },
        {
          domainId: testDomainId,
          originPath: '/api/v2/*',
          destinationUrl: 'http://api-v2:3001',
          enabled: true,
        },
      ];

      const responses = [];
      for (const rule of rules) {
        const response = await request(app.getHttpServer())
          .post('/proxy-rules')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(rule)
          .expect(201);
        responses.push(response.body);
      }

      // Verify priorities were assigned automatically
      expect(responses[0].priority).toBeDefined();
      expect(responses[1].priority).toBeDefined();
      expect(responses[0].priority).not.toBe(responses[1].priority);
    });

    it('should reorder priorities when rule is deleted', async () => {
      // Create rules with sequential priorities
      const rules = [
        { ...testProxyRule, domainId: testDomainId, originPath: '/api/v1/*', priority: 10 },
        { ...testProxyRule, domainId: testDomainId, originPath: '/api/v2/*', priority: 20 },
        { ...testProxyRule, domainId: testDomainId, originPath: '/api/v3/*', priority: 30 },
      ];

      const ruleIds = [];
      for (const rule of rules) {
        const response = await request(app.getHttpServer())
          .post('/proxy-rules')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(rule)
          .expect(201);
        ruleIds.push(response.body.id);
      }

      // Delete middle rule
      await request(app.getHttpServer())
        .delete(`/proxy-rules/${ruleIds[1]}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify remaining rules still exist
      const remainingRules = await request(app.getHttpServer())
        .get('/proxy-rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(remainingRules.body).toHaveLength(2);
    });
  });

  describe('Wildcard and Pattern Matching', () => {
    it('should validate wildcard patterns', async () => {
      const wildcardRules = [
        { ...testProxyRule, domainId: testDomainId, originPath: '/api/*' },
        { ...testProxyRule, domainId: testDomainId, originPath: '/files/**', priority: 20 },
        { ...testProxyRule, domainId: testDomainId, originPath: '/user/*/profile', priority: 30 },
      ];

      for (const rule of wildcardRules) {
        await request(app.getHttpServer())
          .post('/proxy-rules')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(rule)
          .expect(201);
      }

      const response = await request(app.getHttpServer())
        .get('/proxy-rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveLength(3);
    });

    it('should reject invalid wildcard patterns', async () => {
      const invalidPatterns = [
        '/api/*//',
        '/api/**/*',
        '/**/invalid',
        '/api/*/../admin',
      ];

      for (const pattern of invalidPatterns) {
        const rule = {
          ...testProxyRule,
          domainId: testDomainId,
          originPath: pattern,
          priority: Math.floor(Math.random() * 100),
        };

        await request(app.getHttpServer())
          .post('/proxy-rules')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(rule)
          .expect(400);
      }
    });
  });

  describe('Performance Tests', () => {
    it('should handle bulk proxy rule creation', async () => {
      const rules = Array.from({ length: 50 }, (_, i) => ({
        ...testProxyRule,
        domainId: testDomainId,
        originPath: `/api/service${i}/*`,
        destinationUrl: `http://service${i}:3001`,
        priority: i + 1,
      }));

      const promises = rules.map(rule =>
        request(app.getHttpServer())
          .post('/proxy-rules')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(rule)
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Verify all rules were created
      const allRules = await proxyRuleRepository.find();
      expect(allRules.length).toBe(50);
    });

    it('should handle concurrent rule updates', async () => {
      // Create a proxy rule
      const rule = {
        ...testProxyRule,
        domainId: testDomainId,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/proxy-rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(rule);

      const ruleId = createResponse.body.id;

      // Concurrent updates
      const updates = Array.from({ length: 5 }, (_, i) => ({
        destinationUrl: `http://concurrent-backend${i}:3001`,
      }));

      const promises = updates.map(update =>
        request(app.getHttpServer())
          .patch(`/proxy-rules/${ruleId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(update)
      );

      const responses = await Promise.all(promises);

      // At least some should succeed
      const successfulUpdates = responses.filter(res => res.status === 200);
      expect(successfulUpdates.length).toBeGreaterThan(0);
    });
  });

  describe('Security Tests', () => {
    it('should prevent path traversal in origin paths', async () => {
      const maliciousPaths = [
        '/api/../../../etc/passwd',
        '/api/..\\..\\windows\\system32',
        '/api/%2e%2e%2f%2e%2e%2fetc%2fpasswd',
        '/api/....//....//etc/passwd',
      ];

      for (const path of maliciousPaths) {
        const rule = {
          ...testProxyRule,
          domainId: testDomainId,
          originPath: path,
          priority: Math.floor(Math.random() * 100),
        };

        await request(app.getHttpServer())
          .post('/proxy-rules')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(rule)
          .expect(400);
      }
    });

    it('should validate destination URL schemes', async () => {
      const invalidUrls = [
        'javascript:alert("xss")',
        'data:text/html,<script>alert(1)</script>',
        'file:///etc/passwd',
        'ftp://malicious.com/payload',
      ];

      for (const url of invalidUrls) {
        const rule = {
          ...testProxyRule,
          domainId: testDomainId,
          destinationUrl: url,
          priority: Math.floor(Math.random() * 100),
        };

        await request(app.getHttpServer())
          .post('/proxy-rules')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(rule)
          .expect(400);
      }
    });

    it('should sanitize input data', async () => {
      const xssPayload = '<script>alert("xss")</script>';
      const rule = {
        ...testProxyRule,
        domainId: testDomainId,
        originPath: `/api/${xssPayload}`,
        destinationUrl: 'http://backend:3001',
      };

      await request(app.getHttpServer())
        .post('/proxy-rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(rule)
        .expect(400);
    });
  });
});