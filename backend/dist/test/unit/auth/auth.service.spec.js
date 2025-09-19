"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const common_1 = require("@nestjs/common");
const bcrypt = require("bcryptjs");
const auth_service_1 = require("../../../src/modules/auth/auth.service");
const user_entity_1 = require("../../../src/entities/user.entity");
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt;
describe('AuthService', () => {
    let service;
    let userRepository;
    let jwtService;
    const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashedPassword123',
        role: 'user',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    beforeEach(async () => {
        const mockUserRepository = {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
        };
        const mockJwtService = {
            sign: jest.fn(),
            verify: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                {
                    provide: (0, typeorm_1.getRepositoryToken)(user_entity_1.User),
                    useValue: mockUserRepository,
                },
                {
                    provide: jwt_1.JwtService,
                    useValue: mockJwtService,
                },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
        userRepository = module.get((0, typeorm_1.getRepositoryToken)(user_entity_1.User));
        jwtService = module.get(jwt_1.JwtService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('register', () => {
        const registerDto = {
            email: 'newuser@example.com',
            password: 'password123',
            role: 'user',
        };
        it('should register a new user successfully', async () => {
            const hashedPassword = 'hashedPassword123';
            const newUser = {
                ...registerDto,
                id: 'user-2',
                password: hashedPassword,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            userRepository.findOne.mockResolvedValue(null);
            mockedBcrypt.hash.mockResolvedValue(hashedPassword);
            userRepository.create.mockReturnValue(newUser);
            userRepository.save.mockResolvedValue(newUser);
            jwtService.sign.mockReturnValue('mock-jwt-token');
            const result = await service.register(registerDto);
            expect(userRepository.findOne).toHaveBeenCalledWith({
                where: { email: registerDto.email },
            });
            expect(mockedBcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
            expect(userRepository.create).toHaveBeenCalledWith({
                email: registerDto.email,
                password: hashedPassword,
                role: registerDto.role,
            });
            expect(userRepository.save).toHaveBeenCalledWith(newUser);
            expect(result).toEqual({
                id: newUser.id,
                email: newUser.email,
                role: newUser.role,
                isActive: newUser.isActive,
                createdAt: newUser.createdAt,
                updatedAt: newUser.updatedAt,
            });
        });
        it('should throw ConflictException if user already exists', async () => {
            userRepository.findOne.mockResolvedValue(mockUser);
            await expect(service.register(registerDto)).rejects.toThrow(common_1.ConflictException);
            expect(userRepository.findOne).toHaveBeenCalledWith({
                where: { email: registerDto.email },
            });
        });
    });
    describe('login', () => {
        const loginDto = {
            email: 'test@example.com',
            password: 'password123',
        };
        it('should login successfully with valid credentials', async () => {
            userRepository.findOne.mockResolvedValue(mockUser);
            mockedBcrypt.compare.mockResolvedValue(true);
            jwtService.sign.mockReturnValue('mock-jwt-token');
            const result = await service.login(loginDto);
            expect(userRepository.findOne).toHaveBeenCalledWith({
                where: { email: loginDto.email, isActive: true },
            });
            expect(mockedBcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.password);
            expect(result).toEqual({
                access_token: 'mock-jwt-token',
                user: {
                    id: mockUser.id,
                    email: mockUser.email,
                    role: mockUser.role,
                },
            });
        });
        it('should throw UnauthorizedException with invalid email', async () => {
            userRepository.findOne.mockResolvedValue(null);
            await expect(service.login(loginDto)).rejects.toThrow(common_1.UnauthorizedException);
            expect(userRepository.findOne).toHaveBeenCalledWith({
                where: { email: loginDto.email, isActive: true },
            });
        });
        it('should throw UnauthorizedException with invalid password', async () => {
            userRepository.findOne.mockResolvedValue(mockUser);
            mockedBcrypt.compare.mockResolvedValue(false);
            await expect(service.login(loginDto)).rejects.toThrow(common_1.UnauthorizedException);
            expect(mockedBcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.password);
        });
    });
    describe('validateUser', () => {
        it('should return user if found and active', async () => {
            const userId = 'user-1';
            userRepository.findOne.mockResolvedValue(mockUser);
            const result = await service.validateUser(userId);
            expect(userRepository.findOne).toHaveBeenCalledWith({
                where: { id: userId, isActive: true },
            });
            expect(result).toEqual(mockUser);
        });
        it('should return null if user not found', async () => {
            const userId = 'nonexistent';
            userRepository.findOne.mockResolvedValue(null);
            const result = await service.validateUser(userId);
            expect(result).toBeNull();
        });
    });
});
//# sourceMappingURL=auth.service.spec.js.map