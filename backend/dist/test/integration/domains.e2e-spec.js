"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const typeorm_1 = require("@nestjs/typeorm");
const request = require("supertest");
const typeorm_2 = require("@nestjs/typeorm");
const app_module_1 = require("../../src/app.module");
const user_entity_1 = require("../../src/entities/user.entity");
const domain_entity_1 = require("../../src/entities/domain.entity");
const project_entity_1 = require("../../src/entities/project.entity");
describe('Domains (e2e)', () => {
    let app;
    let userRepository;
    let domainRepository;
    let projectRepository;
    let accessToken;
    let userId;
    let testProjectId;
    const testUser = {
        email: 'test@example.com',
        password: 'Password123!',
        roles: ['user'],
    };
    const testProject = {
        name: 'Test Project',
        description: 'Test project for domain tests',
        isActive: true,
    };
    const testDomain = {
        name: 'example.com',
        description: 'Test domain',
        projectId: '',
        isActive: true,
        autoTls: true,
        forceHttps: true,
        blockExternalAccess: false,
        enableWwwRedirect: false,
    };
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [
                app_module_1.AppModule,
                typeorm_1.TypeOrmModule.forRoot({
                    type: 'postgres',
                    host: process.env.DB_HOST || 'meadadigital.com',
                    port: parseInt(process.env.DB_PORT, 10) || 5432,
                    username: process.env.DB_USERNAME || 'netpilot',
                    password: process.env.DB_PASSWORD || 'netpilot',
                    database: process.env.DB_TEST_NAME || 'netpilot_test',
                    entities: [__dirname + '/../../src/entities/*.entity{.ts,.js}'],
                    synchronize: true,
                    dropSchema: true,
                }),
            ],
        }).compile();
        app = moduleFixture.createNestApplication();
        userRepository = app.get((0, typeorm_2.getRepositoryToken)(user_entity_1.User));
        domainRepository = app.get((0, typeorm_2.getRepositoryToken)(domain_entity_1.Domain));
        projectRepository = app.get((0, typeorm_2.getRepositoryToken)(project_entity_1.Project));
        await app.init();
    });
    beforeEach(async () => {
        await domainRepository.delete({});
        await projectRepository.delete({});
        await userRepository.delete({});
        const registerResponse = await request(app.getHttpServer())
            .post('/auth/register')
            .send(testUser);
        userId = registerResponse.body.id;
        const loginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
            email: testUser.email,
            password: testUser.password,
        });
        accessToken = loginResponse.body.access_token;
        const projectResponse = await request(app.getHttpServer())
            .post('/projects')
            .set('Authorization', `Bearer ${accessToken}`)
            .send(testProject);
        testProjectId = projectResponse.body.id;
        testDomain.projectId = testProjectId;
    });
    afterAll(async () => {
        await app.close();
    });
    describe('/domains (POST)', () => {
        it('should create a new domain', async () => {
            const response = await request(app.getHttpServer())
                .post('/domains')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(testDomain)
                .expect(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.name).toBe(testDomain.name);
            expect(response.body.description).toBe(testDomain.description);
            expect(response.body.enabled).toBe(testDomain.enabled);
            expect(response.body.autoSsl).toBe(testDomain.autoSsl);
            const domain = await domainRepository.findOne({
                where: { name: testDomain.name },
            });
            expect(domain).toBeDefined();
            expect(domain.name).toBe(testDomain.name);
        });
        it('should reject domain creation with invalid name', async () => {
            const invalidDomain = {
                ...testDomain,
                name: 'invalid..domain',
            };
            const response = await request(app.getHttpServer())
                .post('/domains')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(invalidDomain)
                .expect(400);
            expect(response.body.message).toContain('domain');
        });
        it('should reject duplicate domain names', async () => {
            await request(app.getHttpServer())
                .post('/domains')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(testDomain)
                .expect(201);
            const response = await request(app.getHttpServer())
                .post('/domains')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(testDomain)
                .expect(409);
            expect(response.body.message).toContain('already exists');
        });
        it('should normalize domain names', async () => {
            const domainWithProtocol = {
                ...testDomain,
                name: 'https://EXAMPLE.COM/',
            };
            const response = await request(app.getHttpServer())
                .post('/domains')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(domainWithProtocol)
                .expect(201);
            expect(response.body.name).toBe('example.com');
        });
        it('should require authentication', async () => {
            await request(app.getHttpServer())
                .post('/domains')
                .send(testDomain)
                .expect(401);
        });
        it('should validate required fields', async () => {
            const incompleteDomain = {
                description: 'Missing name',
            };
            const response = await request(app.getHttpServer())
                .post('/domains')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(incompleteDomain)
                .expect(400);
            expect(response.body.message).toContain('name');
        });
    });
    describe('/domains (GET)', () => {
        beforeEach(async () => {
            const domains = [
                { ...testDomain, name: 'domain1.com', description: 'First domain' },
                { ...testDomain, name: 'domain2.com', description: 'Second domain', enabled: false },
                { ...testDomain, name: 'test.example.com', description: 'Subdomain' },
            ];
            for (const domain of domains) {
                await request(app.getHttpServer())
                    .post('/domains')
                    .set('Authorization', `Bearer ${accessToken}`)
                    .send(domain);
            }
        });
        it('should return paginated domains', async () => {
            const response = await request(app.getHttpServer())
                .get('/domains')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('total');
            expect(response.body).toHaveProperty('page');
            expect(response.body).toHaveProperty('limit');
            expect(response.body).toHaveProperty('totalPages');
            expect(response.body.data).toHaveLength(3);
            expect(response.body.total).toBe(3);
        });
        it('should apply pagination', async () => {
            const response = await request(app.getHttpServer())
                .get('/domains?page=1&limit=2')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.page).toBe(1);
            expect(response.body.limit).toBe(2);
            expect(response.body.totalPages).toBe(2);
        });
        it('should filter by search term', async () => {
            const response = await request(app.getHttpServer())
                .get('/domains?search=domain1')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].name).toBe('domain1.com');
        });
        it('should filter by enabled status', async () => {
            const response = await request(app.getHttpServer())
                .get('/domains?enabled=false')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].enabled).toBe(false);
        });
        it('should include relations', async () => {
            const response = await request(app.getHttpServer())
                .get('/domains')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(response.body.data[0]).toHaveProperty('proxyRules');
            expect(response.body.data[0]).toHaveProperty('redirects');
            expect(response.body.data[0]).toHaveProperty('sslCertificates');
        });
        it('should require authentication', async () => {
            await request(app.getHttpServer())
                .get('/domains')
                .expect(401);
        });
        it('should only return user domains', async () => {
            const otherUser = {
                email: 'other@example.com',
                password: 'Password123!',
                roles: ['user'],
            };
            await request(app.getHttpServer())
                .post('/auth/register')
                .send(otherUser);
            const otherLoginResponse = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                email: otherUser.email,
                password: otherUser.password,
            });
            await request(app.getHttpServer())
                .post('/domains')
                .set('Authorization', `Bearer ${otherLoginResponse.body.access_token}`)
                .send({ ...testDomain, name: 'other-user-domain.com' });
            const response = await request(app.getHttpServer())
                .get('/domains')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(response.body.total).toBe(3);
            expect(response.body.data.every(domain => !domain.name.includes('other-user-domain'))).toBe(true);
        });
    });
    describe('/domains/:id (GET)', () => {
        let domainId;
        beforeEach(async () => {
            const response = await request(app.getHttpServer())
                .post('/domains')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(testDomain);
            domainId = response.body.id;
        });
        it('should return domain by id', async () => {
            const response = await request(app.getHttpServer())
                .get(`/domains/${domainId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(response.body.id).toBe(domainId);
            expect(response.body.name).toBe(testDomain.name);
            expect(response.body).toHaveProperty('proxyRules');
            expect(response.body).toHaveProperty('redirects');
            expect(response.body).toHaveProperty('sslCertificates');
        });
        it('should return 404 for non-existent domain', async () => {
            const response = await request(app.getHttpServer())
                .get('/domains/123e4567-e89b-12d3-a456-426614174999')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(404);
            expect(response.body.message).toContain('not found');
        });
        it('should require authentication', async () => {
            await request(app.getHttpServer())
                .get(`/domains/${domainId}`)
                .expect(401);
        });
        it('should not allow access to other user domains', async () => {
            const otherUser = {
                email: 'other@example.com',
                password: 'Password123!',
                roles: ['user'],
            };
            await request(app.getHttpServer())
                .post('/auth/register')
                .send(otherUser);
            const otherLoginResponse = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                email: otherUser.email,
                password: otherUser.password,
            });
            await request(app.getHttpServer())
                .get(`/domains/${domainId}`)
                .set('Authorization', `Bearer ${otherLoginResponse.body.access_token}`)
                .expect(404);
        });
    });
    describe('/domains/:id (PUT)', () => {
        let domainId;
        beforeEach(async () => {
            const response = await request(app.getHttpServer())
                .post('/domains')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(testDomain);
            domainId = response.body.id;
        });
        it('should update domain', async () => {
            const updateData = {
                name: testDomain.name,
                projectId: testProjectId,
                description: 'Updated description',
                isActive: false,
                forceHttps: false,
            };
            const response = await request(app.getHttpServer())
                .put(`/domains/${domainId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send(updateData)
                .expect(200);
            expect(response.body.description).toBe(updateData.description);
            expect(response.body.isActive).toBe(updateData.isActive);
            expect(response.body.forceHttps).toBe(updateData.forceHttps);
            expect(response.body.name).toBe(testDomain.name);
        });
        it('should prevent updating domain name', async () => {
            const updateData = {
                name: 'newname.com',
                description: 'Updated description',
            };
            const response = await request(app.getHttpServer())
                .put(`/domains/${domainId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send(updateData)
                .expect(400);
            expect(response.body.message).toContain('name cannot be updated');
        });
        it('should return 404 for non-existent domain', async () => {
            await request(app.getHttpServer())
                .put('/domains/123e4567-e89b-12d3-a456-426614174999')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ description: 'Updated' })
                .expect(404);
        });
        it('should require authentication', async () => {
            await request(app.getHttpServer())
                .put(`/domains/${domainId}`)
                .send({ description: 'Updated' })
                .expect(401);
        });
    });
    describe('/domains/:id (DELETE)', () => {
        let domainId;
        beforeEach(async () => {
            const response = await request(app.getHttpServer())
                .post('/domains')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(testDomain);
            domainId = response.body.id;
        });
        it('should delete domain', async () => {
            await request(app.getHttpServer())
                .delete(`/domains/${domainId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            const domain = await domainRepository.findOne({
                where: { id: domainId },
            });
            expect(domain).toBeNull();
        });
        it('should return 404 for non-existent domain', async () => {
            await request(app.getHttpServer())
                .delete('/domains/123e4567-e89b-12d3-a456-426614174999')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(404);
        });
        it('should require authentication', async () => {
            await request(app.getHttpServer())
                .delete(`/domains/${domainId}`)
                .expect(401);
        });
        it('should prevent deletion with dependencies by default', async () => {
            await request(app.getHttpServer())
                .delete(`/domains/${domainId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
        });
        it('should allow force deletion', async () => {
            await request(app.getHttpServer())
                .delete(`/domains/${domainId}?force=true`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
        });
    });
    describe('/domains/:id/toggle (PATCH)', () => {
        let domainId;
        beforeEach(async () => {
            const response = await request(app.getHttpServer())
                .post('/domains')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(testDomain);
            domainId = response.body.id;
        });
        it('should toggle domain enabled status', async () => {
            expect((await domainRepository.findOne({ where: { id: domainId } })).isActive).toBe(true);
            const response = await request(app.getHttpServer())
                .patch(`/domains/${domainId}/toggle`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(response.body.enabled).toBe(false);
            const response2 = await request(app.getHttpServer())
                .patch(`/domains/${domainId}/toggle`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(response2.body.enabled).toBe(true);
        });
        it('should return 404 for non-existent domain', async () => {
            await request(app.getHttpServer())
                .patch('/domains/123e4567-e89b-12d3-a456-426614174999/toggle')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(404);
        });
        it('should require authentication', async () => {
            await request(app.getHttpServer())
                .patch(`/domains/${domainId}/toggle`)
                .expect(401);
        });
    });
    describe('/domains/stats (GET)', () => {
        beforeEach(async () => {
            const domains = [
                { ...testDomain, name: 'enabled1.com', enabled: true, autoSsl: true },
                { ...testDomain, name: 'enabled2.com', enabled: true, autoSsl: false },
                { ...testDomain, name: 'disabled1.com', enabled: false, autoSsl: true },
                { ...testDomain, name: 'disabled2.com', enabled: false, autoSsl: false },
            ];
            for (const domain of domains) {
                await request(app.getHttpServer())
                    .post('/domains')
                    .set('Authorization', `Bearer ${accessToken}`)
                    .send(domain);
            }
        });
        it('should return domain statistics', async () => {
            const response = await request(app.getHttpServer())
                .get('/domains/stats')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(response.body).toHaveProperty('total');
            expect(response.body).toHaveProperty('enabled');
            expect(response.body).toHaveProperty('disabled');
            expect(response.body).toHaveProperty('withSsl');
            expect(response.body.total).toBe(4);
            expect(response.body.enabled).toBe(2);
            expect(response.body.disabled).toBe(2);
        });
        it('should require authentication', async () => {
            await request(app.getHttpServer())
                .get('/domains/stats')
                .expect(401);
        });
    });
    describe('Bulk operations', () => {
        let domainIds;
        beforeEach(async () => {
            domainIds = [];
            const domains = [
                { ...testDomain, name: 'bulk1.com' },
                { ...testDomain, name: 'bulk2.com' },
                { ...testDomain, name: 'bulk3.com' },
            ];
            for (const domain of domains) {
                const response = await request(app.getHttpServer())
                    .post('/domains')
                    .set('Authorization', `Bearer ${accessToken}`)
                    .send(domain);
                domainIds.push(response.body.id);
            }
        });
        it('should enable multiple domains', async () => {
            for (const id of domainIds) {
                await request(app.getHttpServer())
                    .put(`/domains/${id}`)
                    .set('Authorization', `Bearer ${accessToken}`)
                    .send({ enabled: false });
            }
            const response = await request(app.getHttpServer())
                .patch('/domains/bulk/enable')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ ids: domainIds })
                .expect(200);
            expect(response.body.updated).toBe(domainIds.length);
            for (const id of domainIds) {
                const domain = await domainRepository.findOne({ where: { id } });
                expect(domain.isActive).toBe(true);
            }
        });
        it('should disable multiple domains', async () => {
            const response = await request(app.getHttpServer())
                .patch('/domains/bulk/disable')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ ids: domainIds })
                .expect(200);
            expect(response.body.updated).toBe(domainIds.length);
            for (const id of domainIds) {
                const domain = await domainRepository.findOne({ where: { id } });
                expect(domain.isActive).toBe(false);
            }
        });
        it('should delete multiple domains', async () => {
            const response = await request(app.getHttpServer())
                .delete('/domains/bulk')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ ids: domainIds })
                .expect(200);
            expect(response.body.deleted).toBe(domainIds.length);
            for (const id of domainIds) {
                const domain = await domainRepository.findOne({ where: { id } });
                expect(domain).toBeNull();
            }
        });
        it('should require authentication for bulk operations', async () => {
            await request(app.getHttpServer())
                .patch('/domains/bulk/enable')
                .send({ ids: domainIds })
                .expect(401);
        });
    });
    describe('Error handling', () => {
        it('should handle malformed UUIDs', async () => {
            await request(app.getHttpServer())
                .get('/domains/invalid-uuid')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(400);
        });
        it('should handle invalid pagination parameters', async () => {
            const response = await request(app.getHttpServer())
                .get('/domains?page=-1&limit=0')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(400);
            expect(response.body.message).toContain('page');
        });
        it('should handle very large limit values', async () => {
            const response = await request(app.getHttpServer())
                .get('/domains?limit=1000')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(400);
            expect(response.body.message).toContain('limit');
        });
        it('should handle SQL injection attempts', async () => {
            const maliciousSearch = "'; DROP TABLE domains; --";
            const response = await request(app.getHttpServer())
                .get(`/domains?search=${encodeURIComponent(maliciousSearch)}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(response.body.data).toEqual([]);
        });
    });
});
//# sourceMappingURL=domains.e2e-spec.js.map