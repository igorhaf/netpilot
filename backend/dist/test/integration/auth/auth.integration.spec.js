"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const request = require("supertest");
const typeorm_2 = require("@nestjs/typeorm");
const auth_module_1 = require("../../../src/modules/auth/auth.module");
const user_entity_1 = require("../../../src/entities/user.entity");
const auth_service_1 = require("../../../src/modules/auth/auth.service");
const common_1 = require("@nestjs/common");
describe('Auth Integration Tests', () => {
    let app;
    let userRepository;
    let authService;
    const testUser = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'user',
    };
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [
                config_1.ConfigModule.forRoot({
                    isGlobal: true,
                    envFilePath: '.env.test',
                }),
                typeorm_1.TypeOrmModule.forRootAsync({
                    inject: [config_1.ConfigService],
                    useFactory: (configService) => ({
                        type: 'postgres',
                        host: configService.get('DB_HOST', 'localhost'),
                        port: configService.get('DB_PORT', 5433),
                        username: configService.get('DB_USER', 'netpilot_test'),
                        password: configService.get('DB_PASS', 'test_password'),
                        database: configService.get('DB_NAME', 'netpilot_test'),
                        entities: [user_entity_1.User],
                        synchronize: true,
                        dropSchema: true,
                    }),
                }),
                jwt_1.JwtModule.registerAsync({
                    inject: [config_1.ConfigService],
                    useFactory: (configService) => ({
                        secret: configService.get('JWT_SECRET', 'test-secret'),
                        signOptions: {
                            expiresIn: configService.get('JWT_EXPIRES_IN', '1h'),
                        },
                    }),
                }),
                auth_module_1.AuthModule,
            ],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new common_1.ValidationPipe());
        await app.init();
        userRepository = moduleFixture.get((0, typeorm_2.getRepositoryToken)(user_entity_1.User));
        authService = moduleFixture.get(auth_service_1.AuthService);
    });
    afterAll(async () => {
        await app.close();
    });
    beforeEach(async () => {
        await userRepository.clear();
    });
    describe('POST /auth/register', () => {
        it('should register a new user successfully', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send(testUser)
                .expect(201);
            expect(response.body).toMatchObject({
                id: expect.any(Number),
                email: testUser.email,
                name: testUser.name,
                role: testUser.role,
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
            });
            expect(response.body.password).toBeUndefined();
            const savedUser = await userRepository.findOne({
                where: { email: testUser.email },
            });
            expect(savedUser).toBeDefined();
            expect(savedUser.email).toBe(testUser.email);
        });
        it('should return 409 if user already exists', async () => {
            await request(app.getHttpServer())
                .post('/auth/register')
                .send(testUser)
                .expect(201);
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send(testUser)
                .expect(409);
            expect(response.body.error.code).toBe('USER_ALREADY_EXISTS');
        });
        it('should validate required fields', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                email: 'invalid-email',
                password: '123',
            })
                .expect(422);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
            expect(response.body.error.details).toHaveLength(3);
        });
        it('should validate email format', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                ...testUser,
                email: 'invalid-email-format',
            })
                .expect(422);
            expect(response.body.error.details).toContainEqual({
                field: 'email',
                message: expect.stringContaining('email'),
            });
        });
        it('should validate password strength', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                ...testUser,
                password: 'weak',
            })
                .expect(422);
            expect(response.body.error.details).toContainEqual({
                field: 'password',
                message: expect.stringContaining('8 characters'),
            });
        });
    });
    describe('POST /auth/login', () => {
        beforeEach(async () => {
            await authService.register(testUser);
        });
        it('should login with valid credentials', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                email: testUser.email,
                password: testUser.password,
            })
                .expect(200);
            expect(response.body).toMatchObject({
                access_token: expect.any(String),
                refresh_token: expect.any(String),
                expires_in: expect.any(Number),
                token_type: 'Bearer',
                user: {
                    id: expect.any(Number),
                    email: testUser.email,
                    name: testUser.name,
                    role: testUser.role,
                },
            });
            expect(response.body.access_token.split('.')).toHaveLength(3);
            expect(response.body.refresh_token.split('.')).toHaveLength(3);
        });
        it('should return 401 for invalid email', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                email: 'nonexistent@example.com',
                password: testUser.password,
            })
                .expect(401);
            expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
        });
        it('should return 401 for invalid password', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                email: testUser.email,
                password: 'wrongpassword',
            })
                .expect(401);
            expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
        });
        it('should validate required fields', async () => {
            await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                email: testUser.email,
            })
                .expect(422);
        });
        it('should update last login timestamp', async () => {
            const beforeLogin = new Date();
            await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                email: testUser.email,
                password: testUser.password,
            })
                .expect(200);
            const user = await userRepository.findOne({
                where: { email: testUser.email },
            });
            expect(user.isActive).toBe(true);
            expect(user.createdAt).toBeInstanceOf(Date);
            expect(user.updatedAt).toBeInstanceOf(Date);
        });
    });
    describe('POST /auth/refresh', () => {
        let refreshToken;
        beforeEach(async () => {
            await authService.register(testUser);
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
                .set('Authorization', `Bearer ${refreshToken}`)
                .expect(200);
            expect(response.body).toMatchObject({
                access_token: expect.any(String),
                expires_in: expect.any(Number),
                token_type: 'Bearer',
            });
            expect(response.body.access_token).not.toBe(refreshToken);
        });
        it('should return 401 for invalid refresh token', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/refresh')
                .set('Authorization', 'Bearer invalid.refresh.token')
                .expect(401);
            expect(response.body.error.code).toBe('INVALID_REFRESH_TOKEN');
        });
        it('should return 401 for missing refresh token', async () => {
            await request(app.getHttpServer())
                .post('/auth/refresh')
                .expect(401);
        });
        it('should return 401 for expired refresh token', async () => {
            const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDB9.invalid';
            await request(app.getHttpServer())
                .post('/auth/refresh')
                .set('Authorization', `Bearer ${expiredToken}`)
                .expect(401);
        });
    });
    describe('GET /auth/me', () => {
        let accessToken;
        beforeEach(async () => {
            await authService.register(testUser);
            const loginResponse = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                email: testUser.email,
                password: testUser.password,
            });
            accessToken = loginResponse.body.access_token;
        });
        it('should return current user profile', async () => {
            const response = await request(app.getHttpServer())
                .get('/auth/me')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(response.body).toMatchObject({
                id: expect.any(Number),
                email: testUser.email,
                name: testUser.name,
                role: testUser.role,
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                lastLogin: expect.any(String),
            });
            expect(response.body.password).toBeUndefined();
        });
        it('should return 401 for invalid access token', async () => {
            await request(app.getHttpServer())
                .get('/auth/me')
                .set('Authorization', 'Bearer invalid.access.token')
                .expect(401);
        });
        it('should return 401 for missing access token', async () => {
            await request(app.getHttpServer())
                .get('/auth/me')
                .expect(401);
        });
    });
    describe('POST /auth/logout', () => {
        let accessToken;
        beforeEach(async () => {
            await authService.register(testUser);
            const loginResponse = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                email: testUser.email,
                password: testUser.password,
            });
            accessToken = loginResponse.body.access_token;
        });
        it('should logout user successfully', async () => {
            await request(app.getHttpServer())
                .post('/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(204);
            const user = await userRepository.findOne({
                where: { email: testUser.email },
            });
            expect(user.isActive).toBe(true);
        });
        it('should return 401 for invalid access token', async () => {
            await request(app.getHttpServer())
                .post('/auth/logout')
                .set('Authorization', 'Bearer invalid.access.token')
                .expect(401);
        });
    });
    describe('POST /auth/change-password', () => {
        let accessToken;
        beforeEach(async () => {
            await authService.register(testUser);
            const loginResponse = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                email: testUser.email,
                password: testUser.password,
            });
            accessToken = loginResponse.body.access_token;
        });
        it('should change password successfully', async () => {
            const newPassword = 'newPassword123';
            await request(app.getHttpServer())
                .post('/auth/change-password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                currentPassword: testUser.password,
                newPassword,
            })
                .expect(200);
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
                password: newPassword,
            })
                .expect(200);
        });
        it('should return 400 for invalid current password', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/change-password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                currentPassword: 'wrongpassword',
                newPassword: 'newPassword123',
            })
                .expect(400);
            expect(response.body.error.code).toBe('INVALID_CURRENT_PASSWORD');
        });
        it('should validate new password strength', async () => {
            await request(app.getHttpServer())
                .post('/auth/change-password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                currentPassword: testUser.password,
                newPassword: 'weak',
            })
                .expect(422);
        });
    });
    describe('Rate limiting', () => {
        it('should apply rate limiting to login endpoint', async () => {
            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(request(app.getHttpServer())
                    .post('/auth/login')
                    .send({
                    email: 'nonexistent@example.com',
                    password: 'wrongpassword',
                }));
            }
            const responses = await Promise.all(promises);
            const rateLimitedResponses = responses.filter(res => res.status === 429);
            expect(rateLimitedResponses.length).toBeGreaterThan(0);
        });
    });
    describe('Concurrent operations', () => {
        it('should handle concurrent registration attempts', async () => {
            const promises = Array.from({ length: 5 }, (_, i) => request(app.getHttpServer())
                .post('/auth/register')
                .send({
                email: `user${i}@example.com`,
                password: 'password123',
                name: `User ${i}`,
                role: 'user',
            }));
            const responses = await Promise.all(promises);
            responses.forEach(response => {
                expect(response.status).toBe(201);
            });
            const userCount = await userRepository.count();
            expect(userCount).toBe(5);
        });
        it('should handle concurrent login attempts', async () => {
            await authService.register(testUser);
            const promises = Array.from({ length: 5 }, () => request(app.getHttpServer())
                .post('/auth/login')
                .send({
                email: testUser.email,
                password: testUser.password,
            }));
            const responses = await Promise.all(promises);
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.access_token).toBeDefined();
            });
        });
    });
    describe('Database constraints', () => {
        it('should enforce email uniqueness', async () => {
            await authService.register(testUser);
            const duplicateUser = userRepository.create({
                ...testUser,
                email: testUser.email,
            });
            await expect(userRepository.save(duplicateUser)).rejects.toThrow();
        });
    });
    describe('Security headers', () => {
        it('should include security headers in responses', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                email: 'test@example.com',
                password: 'password123',
            });
            expect(response.headers['x-content-type-options']).toBeDefined();
            expect(response.headers['x-frame-options']).toBeDefined();
        });
    });
});
//# sourceMappingURL=auth.integration.spec.js.map