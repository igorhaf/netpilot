"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const typeorm_1 = require("@nestjs/typeorm");
const request = require("supertest");
const jwt_1 = require("@nestjs/jwt");
const typeorm_2 = require("@nestjs/typeorm");
const app_module_1 = require("../../src/app.module");
const user_entity_1 = require("../../src/entities/user.entity");
describe('Auth (e2e)', () => {
    let app;
    let userRepository;
    let jwtService;
    const testUser = {
        email: 'test@example.com',
        password: 'Password123!',
        roles: ['user'],
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
        jwtService = app.get(jwt_1.JwtService);
        await app.init();
    });
    beforeEach(async () => {
        await userRepository.delete({});
    });
    afterAll(async () => {
        await app.close();
    });
    describe('/auth/register (POST)', () => {
        it('should register a new user', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send(testUser)
                .expect(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.email).toBe(testUser.email);
            expect(response.body.roles).toEqual(testUser.roles);
            expect(response.body).not.toHaveProperty('passwordHash');
            const user = await userRepository.findOne({
                where: { email: testUser.email },
            });
            expect(user).toBeDefined();
            expect(user.email).toBe(testUser.email);
        });
        it('should reject registration with existing email', async () => {
            await request(app.getHttpServer())
                .post('/auth/register')
                .send(testUser)
                .expect(201);
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send(testUser)
                .expect(409);
            expect(response.body.message).toContain('already exists');
        });
        it('should reject registration with weak password', async () => {
            const weakPasswordUser = {
                ...testUser,
                password: '123',
            };
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send(weakPasswordUser)
                .expect(400);
            expect(response.body.message).toContain('password');
        });
        it('should reject registration with invalid email', async () => {
            const invalidEmailUser = {
                ...testUser,
                email: 'invalid-email',
            };
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send(invalidEmailUser)
                .expect(400);
            expect(response.body.message).toContain('email');
        });
        it('should reject registration with missing fields', async () => {
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({})
                .expect(400);
        });
    });
    describe('/auth/login (POST)', () => {
        beforeEach(async () => {
            await request(app.getHttpServer())
                .post('/auth/register')
                .send(testUser);
        });
        it('should login with valid credentials', async () => {
            const loginDto = {
                email: testUser.email,
                password: testUser.password,
            };
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send(loginDto)
                .expect(200);
            expect(response.body).toHaveProperty('access_token');
            expect(response.body).toHaveProperty('refresh_token');
            expect(response.body).toHaveProperty('expires_in');
            expect(response.body.user.email).toBe(testUser.email);
            const decoded = jwtService.decode(response.body.access_token);
            expect(decoded).toHaveProperty('sub');
            expect(decoded).toHaveProperty('email', testUser.email);
        });
        it('should reject login with invalid email', async () => {
            const invalidLogin = {
                email: 'nonexistent@example.com',
                password: testUser.password,
            };
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send(invalidLogin)
                .expect(401);
            expect(response.body.message).toContain('Invalid credentials');
        });
        it('should reject login with invalid password', async () => {
            const invalidLogin = {
                email: testUser.email,
                password: 'wrongpassword',
            };
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send(invalidLogin)
                .expect(401);
            expect(response.body.message).toContain('Invalid credentials');
        });
        it('should apply rate limiting', async () => {
            const invalidLogin = {
                email: testUser.email,
                password: 'wrongpassword',
            };
            const promises = Array.from({ length: 6 }, () => request(app.getHttpServer())
                .post('/auth/login')
                .send(invalidLogin));
            const responses = await Promise.all(promises);
            const rateLimitedResponses = responses.filter(res => res.status === 429);
            expect(rateLimitedResponses.length).toBeGreaterThan(0);
        });
    });
    describe('/auth/refresh (POST)', () => {
        let refreshToken;
        beforeEach(async () => {
            await request(app.getHttpServer())
                .post('/auth/register')
                .send(testUser);
            const loginResponse = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                email: testUser.email,
                password: testUser.password,
            });
            refreshToken = loginResponse.body.refresh_token;
        });
        it('should refresh access token with valid refresh token', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/refresh')
                .send({ refresh_token: refreshToken })
                .expect(200);
            expect(response.body).toHaveProperty('access_token');
            expect(response.body).toHaveProperty('expires_in');
            const loginResponse = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                email: testUser.email,
                password: testUser.password,
            });
            expect(response.body.access_token).not.toBe(loginResponse.body.access_token);
        });
        it('should reject invalid refresh token', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/refresh')
                .send({ refresh_token: 'invalid_token' })
                .expect(401);
            expect(response.body.message).toContain('Invalid refresh token');
        });
        it('should reject expired refresh token', async () => {
            const expiredToken = jwtService.sign({ sub: 'user-id', type: 'refresh' }, { expiresIn: '-1h' });
            const response = await request(app.getHttpServer())
                .post('/auth/refresh')
                .send({ refresh_token: expiredToken })
                .expect(401);
            expect(response.body.message).toContain('Invalid refresh token');
        });
    });
    describe('/auth/me (GET)', () => {
        let accessToken;
        beforeEach(async () => {
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
        });
        it('should return user profile with valid token', async () => {
            const response = await request(app.getHttpServer())
                .get('/auth/me')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(response.body.email).toBe(testUser.email);
            expect(response.body.roles).toEqual(testUser.roles);
            expect(response.body).toHaveProperty('id');
            expect(response.body).not.toHaveProperty('passwordHash');
        });
        it('should reject request without token', async () => {
            const response = await request(app.getHttpServer())
                .get('/auth/me')
                .expect(401);
            expect(response.body.message).toContain('Unauthorized');
        });
        it('should reject request with invalid token', async () => {
            const response = await request(app.getHttpServer())
                .get('/auth/me')
                .set('Authorization', 'Bearer invalid_token')
                .expect(401);
            expect(response.body.message).toContain('Unauthorized');
        });
        it('should reject expired token', async () => {
            const expiredToken = jwtService.sign({ sub: 'user-id', email: testUser.email }, { expiresIn: '-1h' });
            const response = await request(app.getHttpServer())
                .get('/auth/me')
                .set('Authorization', `Bearer ${expiredToken}`)
                .expect(401);
            expect(response.body.message).toContain('Unauthorized');
        });
    });
    describe('/auth/logout (POST)', () => {
        let accessToken;
        beforeEach(async () => {
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
        });
        it('should logout successfully', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(response.body.message).toContain('Logged out successfully');
            const user = await userRepository.findOne({
                where: { email: testUser.email },
            });
            expect(user.isActive).toBe(true);
        });
        it('should reject logout without token', async () => {
            await request(app.getHttpServer())
                .post('/auth/logout')
                .expect(401);
        });
    });
    describe('/auth/change-password (POST)', () => {
        let accessToken;
        beforeEach(async () => {
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
        });
        it('should change password successfully', async () => {
            const changePasswordDto = {
                currentPassword: testUser.password,
                newPassword: 'NewPassword123!',
            };
            const response = await request(app.getHttpServer())
                .post('/auth/change-password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(changePasswordDto)
                .expect(200);
            expect(response.body.message).toContain('Password changed successfully');
            await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                email: testUser.email,
                password: testUser.password,
            })
                .expect(401);
            await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                email: testUser.email,
                password: changePasswordDto.newPassword,
            })
                .expect(200);
        });
        it('should reject change with wrong current password', async () => {
            const changePasswordDto = {
                currentPassword: 'wrongpassword',
                newPassword: 'NewPassword123!',
            };
            const response = await request(app.getHttpServer())
                .post('/auth/change-password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(changePasswordDto)
                .expect(401);
            expect(response.body.message).toContain('Current password is incorrect');
        });
        it('should reject weak new password', async () => {
            const changePasswordDto = {
                currentPassword: testUser.password,
                newPassword: '123',
            };
            const response = await request(app.getHttpServer())
                .post('/auth/change-password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(changePasswordDto)
                .expect(400);
            expect(response.body.message).toContain('password');
        });
    });
    describe('Authentication edge cases', () => {
        it('should handle malformed JWT tokens', async () => {
            const malformedTokens = [
                'Bearer malformed.token',
                'Bearer token.without.signature',
                'Bearer .empty.segments.',
                'Bearer not-even-jwt',
            ];
            for (const token of malformedTokens) {
                await request(app.getHttpServer())
                    .get('/auth/me')
                    .set('Authorization', token)
                    .expect(401);
            }
        });
        it('should handle concurrent login attempts', async () => {
            await request(app.getHttpServer())
                .post('/auth/register')
                .send(testUser);
            const loginDto = {
                email: testUser.email,
                password: testUser.password,
            };
            const promises = Array.from({ length: 5 }, () => request(app.getHttpServer())
                .post('/auth/login')
                .send(loginDto));
            const responses = await Promise.all(promises);
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('access_token');
            });
        });
        it('should handle user not found during token validation', async () => {
            const fakeToken = jwtService.sign({ sub: 'non-existent-user-id', email: 'fake@example.com' }, { expiresIn: '1h' });
            const response = await request(app.getHttpServer())
                .get('/auth/me')
                .set('Authorization', `Bearer ${fakeToken}`)
                .expect(401);
            expect(response.body.message).toContain('Unauthorized');
        });
    });
    describe('Security features', () => {
        it('should include security headers', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                email: 'test@example.com',
                password: 'wrongpassword',
            });
            expect(response.headers).toHaveProperty('x-content-type-options');
            expect(response.headers).toHaveProperty('x-frame-options');
            expect(response.headers['x-content-type-options']).toBe('nosniff');
        });
        it('should not expose sensitive information in errors', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                email: 'nonexistent@example.com',
                password: 'somepassword',
            })
                .expect(401);
            expect(response.body.message).toBe('Invalid credentials');
            expect(response.body.message).not.toContain('email not found');
            expect(response.body.message).not.toContain('user does not exist');
        });
        it('should sanitize input data', async () => {
            const maliciousInput = {
                email: '<script>alert("xss")</script>@example.com',
                password: 'Password123!',
            };
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send(maliciousInput)
                .expect(400);
            expect(response.body.message).toContain('email');
        });
    });
});
//# sourceMappingURL=auth.e2e-spec.js.map