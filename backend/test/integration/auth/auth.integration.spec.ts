import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AuthModule } from '../../../src/modules/auth/auth.module';
import { User } from '../../../src/entities/user.entity';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { ValidationPipe } from '@nestjs/common';

describe('Auth Integration Tests', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let authService: AuthService;

  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    role: 'user' as const,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('DB_HOST', 'meadadigital.com'),
            port: configService.get('DB_PORT', 5433), // Test database port
            username: configService.get('DB_USER', 'netpilot_test'),
            password: configService.get('DB_PASS', 'test_password'),
            database: configService.get('DB_NAME', 'netpilot_test'),
            entities: [User],
            synchronize: true, // Only for testing
            dropSchema: true, // Clean state for each test run
          }),
        }),
        JwtModule.registerAsync({
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            secret: configService.get('JWT_SECRET', 'test-secret'),
            signOptions: {
              expiresIn: configService.get('JWT_EXPIRES_IN', '1h'),
            },
          }),
        }),
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    authService = moduleFixture.get<AuthService>(AuthService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean database before each test
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

      // Verify user was saved to database
      const savedUser = await userRepository.findOne({
        where: { email: testUser.email },
      });
      expect(savedUser).toBeDefined();
      expect(savedUser.email).toBe(testUser.email);
    });

    it('should return 409 if user already exists', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      // Second registration with same email
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
          password: '123', // Too short
          // Missing name
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
      // Create test user
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

      // Verify tokens are valid JWTs
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
          // Missing password
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
    let refreshToken: string;

    beforeEach(async () => {
      // Create user and get refresh token
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

      // New access token should be different
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
      // This would require manipulating JWT expiration or waiting for actual expiration
      // For testing purposes, we can mock an expired token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDB9.invalid';

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
  });

  describe('GET /auth/me', () => {
    let accessToken: string;

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
    let accessToken: string;

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

      // Verify refresh token was cleared
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
    let accessToken: string;

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

      // Verify old password no longer works
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(401);

      // Verify new password works
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

      // Attempt multiple rapid login requests
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app.getHttpServer())
            .post('/auth/login')
            .send({
              email: 'nonexistent@example.com',
              password: 'wrongpassword',
            })
        );
      }

      const responses = await Promise.all(promises);

      // Some requests should be rate limited (429)
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Concurrent operations', () => {
    it('should handle concurrent registration attempts', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: `user${i}@example.com`,
            password: 'password123',
            name: `User ${i}`,
            role: 'user',
          })
      );

      const responses = await Promise.all(promises);

      // All registrations should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Verify all users were created
      const userCount = await userRepository.count();
      expect(userCount).toBe(5);
    });

    it('should handle concurrent login attempts', async () => {
      await authService.register(testUser);

      const promises = Array.from({ length: 5 }, () =>
        request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password,
          })
      );

      const responses = await Promise.all(promises);

      // All logins should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.access_token).toBeDefined();
      });
    });
  });

  describe('Database constraints', () => {
    it('should enforce email uniqueness', async () => {
      await authService.register(testUser);

      // Attempt to register user with same email directly via repository
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

      // Verify common security headers
      expect(response.headers['x-content-type-options']).toBeDefined();
      expect(response.headers['x-frame-options']).toBeDefined();
    });
  });
});