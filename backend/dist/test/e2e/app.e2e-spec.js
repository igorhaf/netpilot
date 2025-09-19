"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const request = require("supertest");
const typeorm_2 = require("@nestjs/typeorm");
const app_module_1 = require("../../src/app.module");
const user_entity_1 = require("../../src/entities/user.entity");
const domain_entity_1 = require("../../src/entities/domain.entity");
const proxy_rule_entity_1 = require("../../src/entities/proxy-rule.entity");
const ssl_certificate_entity_1 = require("../../src/entities/ssl-certificate.entity");
describe('NetPilot E2E Tests', () => {
    let app;
    let userRepository;
    let domainRepository;
    let proxyRuleRepository;
    let sslCertificateRepository;
    let accessToken;
    let adminUser;
    let testDomain;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [
                config_1.ConfigModule.forRoot({
                    isGlobal: true,
                    envFilePath: '.env.test',
                }),
                app_module_1.AppModule,
            ],
        })
            .overrideModule(typeorm_1.TypeOrmModule)
            .useModule(typeorm_1.TypeOrmModule.forRootAsync({
            inject: [config_1.ConfigService],
            useFactory: (configService) => ({
                type: 'postgres',
                host: configService.get('DB_HOST', 'localhost'),
                port: configService.get('DB_PORT', 5433),
                username: configService.get('DB_USER', 'netpilot_test'),
                password: configService.get('DB_PASS', 'test_password'),
                database: configService.get('DB_NAME', 'netpilot_test'),
                entities: [user_entity_1.User, domain_entity_1.Domain, proxy_rule_entity_1.ProxyRule, ssl_certificate_entity_1.SslCertificate],
                synchronize: true,
                dropSchema: true,
            }),
        }))
            .compile();
        app = moduleFixture.createNestApplication();
        await app.init();
        userRepository = moduleFixture.get((0, typeorm_2.getRepositoryToken)(user_entity_1.User));
        domainRepository = moduleFixture.get((0, typeorm_2.getRepositoryToken)(domain_entity_1.Domain));
        proxyRuleRepository = moduleFixture.get((0, typeorm_2.getRepositoryToken)(proxy_rule_entity_1.ProxyRule));
        sslCertificateRepository = moduleFixture.get((0, typeorm_2.getRepositoryToken)(ssl_certificate_entity_1.SslCertificate));
    });
    afterAll(async () => {
        await app.close();
    });
    beforeEach(async () => {
        await sslCertificateRepository.clear();
        await proxyRuleRepository.clear();
        await domainRepository.clear();
        await userRepository.clear();
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
            const listDomainsResponse = await request(app.getHttpServer())
                .get('/domains')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(listDomainsResponse.body.data).toHaveLength(1);
            expect(listDomainsResponse.body.data[0].domain).toBe('example.com');
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
            const toggleResponse = await request(app.getHttpServer())
                .patch(`/domains/${testDomain.id}/toggle`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(toggleResponse.body.enabled).toBe(true);
            await request(app.getHttpServer())
                .delete(`/domains/${testDomain.id}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(204);
            await request(app.getHttpServer())
                .get(`/domains/${testDomain.id}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(404);
        });
    });
    describe('Proxy Rules Management Workflow', () => {
        beforeEach(async () => {
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
            const listRulesResponse = await request(app.getHttpServer())
                .get('/proxy-rules')
                .set('Authorization', `Bearer ${accessToken}`)
                .query({ domainId: testDomain.id })
                .expect(200);
            expect(listRulesResponse.body.data).toHaveLength(1);
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
            const testRuleResponse = await request(app.getHttpServer())
                .post(`/proxy-rules/${proxyRule.id}/test`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(testRuleResponse.body).toHaveProperty('success');
            expect(testRuleResponse.body).toHaveProperty('responseTimeMs');
            const applyConfigResponse = await request(app.getHttpServer())
                .post('/proxy-rules/apply')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(applyConfigResponse.body.message).toContain('Configuration applied');
            expect(applyConfigResponse.body.appliedRules).toBe(1);
            await request(app.getHttpServer())
                .delete(`/proxy-rules/${proxyRule.id}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(204);
        });
    });
    describe('SSL Certificate Management Workflow', () => {
        beforeEach(async () => {
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
            const listCertsResponse = await request(app.getHttpServer())
                .get('/ssl-certificates')
                .set('Authorization', `Bearer ${accessToken}`)
                .query({ domainId: testDomain.id })
                .expect(200);
            expect(listCertsResponse.body.data).toHaveLength(1);
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
            const checkExpiringResponse = await request(app.getHttpServer())
                .get('/ssl-certificates/check-expiration')
                .set('Authorization', `Bearer ${accessToken}`)
                .query({ days: 30 })
                .expect(200);
            expect(checkExpiringResponse.body).toHaveProperty('expiringCertificates');
            expect(checkExpiringResponse.body).toHaveProperty('totalExpiring');
            const verifyResponse = await request(app.getHttpServer())
                .post(`/ssl-certificates/${certificate.id}/verify`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(verifyResponse.body).toHaveProperty('valid');
            await request(app.getHttpServer())
                .delete(`/ssl-certificates/${certificate.id}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(204);
        });
    });
    describe('Dashboard and System Monitoring', () => {
        beforeEach(async () => {
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
            await request(app.getHttpServer())
                .post('/domains')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                domain: 'logged.example.com',
                enabled: true,
            });
            const logsResponse = await request(app.getHttpServer())
                .get('/logs')
                .set('Authorization', `Bearer ${accessToken}`)
                .query({ level: 'info', limit: 10 })
                .expect(200);
            expect(logsResponse.body.data).toBeDefined();
            expect(Array.isArray(logsResponse.body.data)).toBe(true);
            const domainCreationLog = logsResponse.body.data.find((log) => log.message.includes('Domain created') && log.context?.domain === 'logged.example.com');
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
            const protectedEndpoints = [
                { method: 'get', path: '/domains' },
                { method: 'post', path: '/domains' },
                { method: 'get', path: '/proxy-rules' },
                { method: 'get', path: '/ssl-certificates' },
                { method: 'get', path: '/dashboard/stats' },
                { method: 'get', path: '/logs' },
            ];
            for (const endpoint of protectedEndpoints) {
                await request(app.getHttpServer())[endpoint.method](endpoint.path)
                    .expect(401);
            }
        });
        it('should handle token expiration gracefully', async () => {
            const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxNjAwMDAwMDAwfQ.invalid';
            await request(app.getHttpServer())
                .get('/domains')
                .set('Authorization', `Bearer ${expiredToken}`)
                .expect(401);
        });
    });
    describe('Data Validation and Constraints', () => {
        it('should enforce domain uniqueness across users', async () => {
            await request(app.getHttpServer())
                .post('/domains')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                domain: 'unique.example.com',
                enabled: true,
            })
                .expect(201);
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
                    sourcePath: 'invalid-path',
                    targetUrl: 'http://localhost:3001',
                },
                {
                    domainId: domainResponse.body.id,
                    sourcePath: '/api',
                    targetUrl: 'invalid-url',
                },
                {
                    domainId: 999999,
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
            const largeDescription = 'a'.repeat(10000);
            await request(app.getHttpServer())
                .post('/domains')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                domain: 'large.example.com',
                enabled: true,
                description: largeDescription,
            })
                .expect(422);
        });
    });
    describe('Performance and Scalability', () => {
        it('should handle multiple concurrent requests', async () => {
            const promises = Array.from({ length: 10 }, (_, i) => request(app.getHttpServer())
                .post('/domains')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                domain: `concurrent${i}.example.com`,
                enabled: true,
            }));
            const responses = await Promise.all(promises);
            responses.forEach(response => {
                expect(response.status).toBe(201);
            });
            const listResponse = await request(app.getHttpServer())
                .get('/domains')
                .set('Authorization', `Bearer ${accessToken}`)
                .query({ limit: 20 });
            expect(listResponse.body.data).toHaveLength(10);
        });
        it('should handle pagination correctly with large datasets', async () => {
            const domainPromises = Array.from({ length: 25 }, (_, i) => request(app.getHttpServer())
                .post('/domains')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                domain: `paginated${i}.example.com`,
                enabled: i % 2 === 0,
            }));
            await Promise.all(domainPromises);
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
//# sourceMappingURL=app.e2e-spec.js.map