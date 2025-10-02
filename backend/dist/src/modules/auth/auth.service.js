"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
const user_entity_1 = require("../../entities/user.entity");
const logs_service_1 = require("../logs/logs.service");
const log_entity_1 = require("../../entities/log.entity");
let AuthService = class AuthService {
    constructor(userRepository, jwtService, logsService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.logsService = logsService;
    }
    async register(registerDto) {
        const { email, password, role } = registerDto;
        const existingUser = await this.userRepository.findOne({
            where: { email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email já está em uso');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = this.userRepository.create({
            email,
            password: hashedPassword,
            role: role || 'admin',
        });
        await this.userRepository.save(user);
        const { password: _, ...result } = user;
        return result;
    }
    async login(loginDto) {
        const { email, password } = loginDto;
        const log = await this.logsService.createLog(log_entity_1.LogType.SYSTEM, 'Login', `Tentativa de login: ${email}`);
        try {
            const user = await this.userRepository.findOne({
                where: { email, isActive: true },
            });
            if (!user || !(await bcrypt.compare(password, user.password))) {
                await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.FAILED, `Login falhou para ${email}`);
                throw new common_1.UnauthorizedException('Credenciais inválidas');
            }
            const payload = { email: user.email, sub: user.id, role: user.role };
            const token = this.jwtService.sign(payload);
            await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.SUCCESS, `Login realizado com sucesso: ${email}`, JSON.stringify({ userId: user.id, role: user.role }));
            return {
                access_token: token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                },
            };
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.FAILED, error.message || 'Erro ao fazer login', error.stack);
            throw error;
        }
    }
    async validateUser(userId) {
        return this.userRepository.findOne({
            where: { id: userId, isActive: true },
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService,
        logs_service_1.LogsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map