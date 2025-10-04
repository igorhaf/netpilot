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
exports.ConsoleService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
const crypto = require("crypto");
const ssh_session_entity_1 = require("../../entities/ssh-session.entity");
const console_log_entity_1 = require("../../entities/console-log.entity");
const user_entity_1 = require("../../entities/user.entity");
const logs_service_1 = require("../logs/logs.service");
const log_entity_1 = require("../../entities/log.entity");
let ConsoleService = class ConsoleService {
    constructor(sshSessionRepository, consoleLogRepository, userRepository, httpService, configService, logsService) {
        this.sshSessionRepository = sshSessionRepository;
        this.consoleLogRepository = consoleLogRepository;
        this.userRepository = userRepository;
        this.httpService = httpService;
        this.configService = configService;
        this.logsService = logsService;
        this.systemOpsUrl = this.configService.get('SYSTEM_OPS_URL', 'http://localhost:8001');
        this.systemOpsToken = this.configService.get('SYSTEM_OPS_TOKEN', 'netpilot-internal-token');
    }
    async onModuleInit() {
        await this.checkSystemOpsHealth();
        await this.ensureDefaultSshSession();
    }
    async connectToSession(userId, sessionId) {
        try {
            const session = await this.sshSessionRepository.findOne({
                where: { id: sessionId, userId, isActive: true }
            });
            if (!session) {
                throw new common_1.NotFoundException('Sessão SSH não encontrada ou não pertence ao usuário');
            }
            const connectionRequest = {
                sessionId: session.id,
                hostname: session.hostname,
                port: session.port,
                username: session.username,
                authType: session.authType,
                password: session.authType === 'password' ? this.decrypt(session.password) : undefined,
                privateKey: session.authType === 'key' ? this.decrypt(session.privateKey) : undefined,
                passphrase: session.passphrase ? this.decrypt(session.passphrase) : undefined,
                timeout: session.connectionOptions?.readyTimeout ? Math.floor(session.connectionOptions.readyTimeout / 1000) : 30,
                keepalive: session.connectionOptions?.keepaliveInterval ? Math.floor(session.connectionOptions.keepaliveInterval / 1000) : 60
            };
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.systemOpsUrl}/ssh/connect`, connectionRequest, {
                headers: {
                    'Authorization': `Bearer ${this.systemOpsToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            }));
            const result = response.data;
            if (result.success) {
                await this.sshSessionRepository.update(sessionId, {
                    lastConnectedAt: new Date(),
                    status: 'active'
                });
                return {
                    success: true,
                    message: result.message,
                    connectionId: result.connectionId
                };
            }
            else {
                return {
                    success: false,
                    message: result.message
                };
            }
        }
        catch (error) {
            if (error.response?.status === 400) {
                throw new common_1.BadRequestException(error.response.data.detail || 'Erro na conexão SSH');
            }
            if (error.code === 'ECONNREFUSED') {
                throw new common_1.BadRequestException('Microserviço SSH não está disponível');
            }
            throw new common_1.BadRequestException(`Erro ao conectar SSH: ${error.message}`);
        }
    }
    async executeCommand(userId, executeDto) {
        try {
            const session = await this.sshSessionRepository.findOne({
                where: { id: executeDto.sessionId, userId, isActive: true }
            });
            if (!session) {
                throw new common_1.BadRequestException('Sessão SSH não encontrada ou não pertence ao usuário');
            }
            const commandRequest = {
                sessionId: executeDto.sessionId,
                command: executeDto.command,
                workingDirectory: executeDto.workingDirectory,
                environment: executeDto.environment || {},
                timeout: executeDto.timeout || 30,
                userId: userId
            };
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.systemOpsUrl}/ssh/execute`, commandRequest, {
                headers: {
                    'Authorization': `Bearer ${this.systemOpsToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: (executeDto.timeout || 30) * 1000 + 10000
            }));
            const result = response.data;
            await this.sshSessionRepository.increment({ id: executeDto.sessionId }, 'commandCount', 1);
            const user = await this.userRepository.findOne({ where: { id: userId } });
            const consoleLog = this.consoleLogRepository.create({
                command: result.command,
                output: result.output,
                errorOutput: result.errorOutput || '',
                exitCode: result.exitCode,
                executionTime: result.executionTimeMs,
                status: result.success ? 'completed' : 'failed',
                workingDirectory: result.workingDirectory || '~',
                environment: result.environment || {},
                sessionId: executeDto.sessionId,
                userId: userId,
                executedAt: new Date(result.executedAt)
            });
            const savedLog = await this.consoleLogRepository.save(consoleLog);
            const logAction = `SSH Console: ${result.command.substring(0, 100)}${result.command.length > 100 ? '...' : ''}`;
            const logMessage = `Comando executado por ${user?.email || userId} via Console SSH | Exit Code: ${result.exitCode} | ${result.executionTimeMs}ms`;
            const logDetails = JSON.stringify({
                userId: userId,
                userEmail: user?.email,
                userRole: user?.role,
                sessionId: executeDto.sessionId,
                command: result.command,
                workingDirectory: result.workingDirectory || '~',
                exitCode: result.exitCode,
                success: result.success,
                executionTime: result.executionTimeMs,
                executedAt: result.executedAt,
                output: result.output?.substring(0, 500),
                errorOutput: result.errorOutput?.substring(0, 500)
            }, null, 2);
            const auditLog = await this.logsService.createLog(log_entity_1.LogType.SYSTEM, logAction, logMessage, logDetails);
            await this.logsService.updateLogStatus(auditLog.id, result.success ? log_entity_1.LogStatus.SUCCESS : log_entity_1.LogStatus.FAILED);
            return savedLog;
        }
        catch (error) {
            if (error.response?.status === 400) {
                throw new common_1.BadRequestException(error.response.data.detail || 'Erro na execução do comando');
            }
            if (error.code === 'ECONNREFUSED') {
                throw new common_1.BadRequestException('Microserviço SSH não está disponível');
            }
            if (error.code === 'ETIMEDOUT') {
                throw new common_1.BadRequestException('Comando excedeu o tempo limite');
            }
            throw new common_1.BadRequestException(`Erro ao executar comando: ${error.message}`);
        }
    }
    async disconnectFromSession(userId, sessionId) {
        try {
            const session = await this.sshSessionRepository.findOne({
                where: { id: sessionId, userId, isActive: true }
            });
            if (!session) {
                throw new common_1.BadRequestException('Sessão SSH não encontrada ou não pertence ao usuário');
            }
            const disconnectRequest = {
                sessionId: sessionId,
                userId: userId
            };
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.systemOpsUrl}/ssh/disconnect`, disconnectRequest, {
                headers: {
                    'Authorization': `Bearer ${this.systemOpsToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }));
            const result = response.data;
            if (result.success) {
                await this.sshSessionRepository.update(sessionId, {
                    status: 'disconnected',
                    lastDisconnectedAt: new Date()
                });
            }
            return {
                success: result.success,
                message: result.message
            };
        }
        catch (error) {
            if (error.response?.status >= 400 && error.response?.status < 500) {
                throw new common_1.BadRequestException(error.response.data.detail || 'Erro na desconexão SSH');
            }
            throw new common_1.BadRequestException(`Erro ao desconectar SSH: ${error.message}`);
        }
    }
    async getActiveSSHSessions() {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.systemOpsUrl}/ssh/sessions`, {
                headers: {
                    'Authorization': `Bearer ${this.systemOpsToken}`
                },
                timeout: 10000
            }));
            return response.data.sessions || [];
        }
        catch (error) {
            console.error('Erro ao obter sessões SSH ativas:', error.message);
            return [];
        }
    }
    async createSession(userId, createSshSessionDto) {
        return this.create(createSshSessionDto, userId);
    }
    async findUserSessions(userId) {
        return this.findAll(userId);
    }
    async findSessionById(userId, id) {
        return this.findOne(id, userId);
    }
    async updateSession(userId, id, updateSshSessionDto) {
        return this.update(id, updateSshSessionDto, userId);
    }
    async deleteSession(userId, id) {
        return this.remove(id, userId);
    }
    async disconnectSession(userId, sessionId) {
        return this.disconnectFromSession(userId, sessionId);
    }
    async getCommandLogs(userId, sessionId, page = 1, limit = 50) {
        return this.getCommandHistory(sessionId, userId, page, limit);
    }
    async getUserSessionStats(userId) {
        const sessions = await this.findAll(userId);
        const activeSessions = await this.getActiveSSHSessions();
        return {
            totalSessions: sessions.length,
            activeSessions: activeSessions.filter(s => sessions.some(us => us.id === s.sessionId)).length,
            lastActivity: sessions.length > 0 ? Math.max(...sessions.map(s => s.lastConnectedAt?.getTime() || 0)) : null
        };
    }
    isSessionConnected(userId, sessionId) {
        return false;
    }
    async create(createSshSessionDto, userId) {
        const encryptedPassword = createSshSessionDto.password ? this.encrypt(createSshSessionDto.password) : null;
        const encryptedPrivateKey = createSshSessionDto.privateKey ? this.encrypt(createSshSessionDto.privateKey) : null;
        const encryptedPassphrase = createSshSessionDto.passphrase ? this.encrypt(createSshSessionDto.passphrase) : null;
        const sshSession = this.sshSessionRepository.create({
            ...createSshSessionDto,
            password: encryptedPassword,
            privateKey: encryptedPrivateKey,
            passphrase: encryptedPassphrase,
            userId,
        });
        return await this.sshSessionRepository.save(sshSession);
    }
    async findAll(userId) {
        const sessions = await this.sshSessionRepository.find({
            where: { userId, isActive: true },
            order: { createdAt: 'DESC' }
        });
        return sessions.map(session => ({
            ...session,
            password: session.password ? '***' : null,
            privateKey: session.privateKey ? '***' : null,
            passphrase: session.passphrase ? '***' : null,
        }));
    }
    async findOne(id, userId) {
        const session = await this.sshSessionRepository.findOne({
            where: { id, userId, isActive: true }
        });
        if (!session) {
            throw new common_1.NotFoundException('Sessão SSH não encontrada');
        }
        return {
            ...session,
            password: session.password ? '***' : null,
            privateKey: session.privateKey ? '***' : null,
            passphrase: session.passphrase ? '***' : null,
        };
    }
    async update(id, updateSshSessionDto, userId) {
        const session = await this.findOne(id, userId);
        if (updateSshSessionDto.password) {
            updateSshSessionDto.password = this.encrypt(updateSshSessionDto.password);
        }
        if (updateSshSessionDto.privateKey) {
            updateSshSessionDto.privateKey = this.encrypt(updateSshSessionDto.privateKey);
        }
        if (updateSshSessionDto.passphrase) {
            updateSshSessionDto.passphrase = this.encrypt(updateSshSessionDto.passphrase);
        }
        await this.sshSessionRepository.update(id, updateSshSessionDto);
        return this.findOne(id, userId);
    }
    async remove(id, userId) {
        const session = await this.findOne(id, userId);
        try {
            await this.disconnectFromSession(userId, id);
        }
        catch (error) {
        }
        await this.sshSessionRepository.update(id, { isActive: false });
    }
    async getCommandHistory(sessionId, userId, page = 1, limit = 50) {
        await this.findOne(sessionId, userId);
        const [logs, total] = await this.consoleLogRepository.findAndCount({
            where: { sessionId, userId },
            order: { executedAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return {
            logs,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async checkSystemOpsHealth() {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.systemOpsUrl}/ssh/health`, {
                timeout: 5000
            }));
            if (response.data.status !== 'healthy') {
                console.warn('⚠️ Microserviço SSH não está saudável:', response.data.message);
            }
            else {
                console.log('✅ Microserviço SSH está saudável');
            }
        }
        catch (error) {
            console.error('❌ Microserviço SSH não está disponível:', error.message);
            throw new Error('Microserviço SSH não está disponível. Verifique se está executando na porta 3001.');
        }
    }
    async ensureDefaultSshSession() {
        try {
            const defaultHost = process.env.SSH_DEFAULT_HOST;
            const defaultPort = process.env.SSH_DEFAULT_PORT || '22';
            const defaultUser = process.env.SSH_DEFAULT_USER || 'root';
            const defaultAuthType = (process.env.SSH_DEFAULT_AUTH_TYPE || 'password');
            const defaultPassword = process.env.SSH_DEFAULT_PASSWORD;
            const defaultPrivateKeyPath = process.env.SSH_DEFAULT_PRIVATE_KEY_PATH;
            const defaultPassphrase = process.env.SSH_DEFAULT_PASSPHRASE;
            if (!defaultHost) {
                console.log('⚠️  SSH_DEFAULT_HOST not found in .env, skipping default session creation');
                return;
            }
            const existingSession = await this.sshSessionRepository.findOne({
                where: {
                    hostname: defaultHost,
                    port: parseInt(defaultPort),
                    username: defaultUser,
                    isActive: true
                }
            });
            if (existingSession) {
                console.log('✅ Default SSH session already exists');
                return;
            }
            const adminUser = await this.sshSessionRepository.manager.findOne('User', {
                where: { email: 'admin@netpilot.local' }
            });
            if (!adminUser) {
                console.log('⚠️  Admin user not found, cannot create default SSH session');
                return;
            }
            let encryptedPassword = null;
            let encryptedPrivateKey = null;
            let encryptedPassphrase = null;
            if (defaultAuthType === 'password') {
                if (!defaultPassword) {
                    console.log('⚠️  SSH_DEFAULT_PASSWORD not found for password auth');
                    return;
                }
                encryptedPassword = this.encrypt(defaultPassword);
            }
            else {
                if (!defaultPrivateKeyPath) {
                    console.log('⚠️  SSH_DEFAULT_PRIVATE_KEY_PATH not found for key auth');
                    return;
                }
                const fs = require('fs');
                if (!fs.existsSync(defaultPrivateKeyPath)) {
                    console.log(`⚠️  Private key file not found at: ${defaultPrivateKeyPath}`);
                    return;
                }
                const privateKeyContent = fs.readFileSync(defaultPrivateKeyPath, 'utf8');
                encryptedPrivateKey = this.encrypt(privateKeyContent);
                if (defaultPassphrase) {
                    encryptedPassphrase = this.encrypt(defaultPassphrase);
                }
            }
            const defaultSession = this.sshSessionRepository.create({
                sessionName: 'External Server',
                hostname: defaultHost,
                port: parseInt(defaultPort),
                username: defaultUser,
                authType: defaultAuthType,
                password: encryptedPassword,
                privateKey: encryptedPrivateKey,
                passphrase: encryptedPassphrase,
                isActive: true,
                description: `Sessão SSH padrão para servidor externo (${defaultHost}) - Via Python SSH Service`,
                userId: adminUser.id,
                connectionOptions: {
                    readyTimeout: 20000,
                    keepaliveInterval: 60000
                }
            });
            await this.sshSessionRepository.save(defaultSession);
            console.log(`✅ Default SSH session created for external server: ${defaultHost} (${defaultAuthType}) - Python SSH Service`);
        }
        catch (error) {
            console.error('❌ Error creating default SSH session:', error.message);
        }
    }
    encrypt(text) {
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(process.env.SSH_ENCRYPTION_KEY || 'netpilot-ssh-key', 'salt', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(algorithm, key);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }
    decrypt(encryptedText) {
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(process.env.SSH_ENCRYPTION_KEY || 'netpilot-ssh-key', 'salt', 32);
        const textParts = encryptedText.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedData = textParts.join(':');
        const decipher = crypto.createDecipher(algorithm, key);
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
};
exports.ConsoleService = ConsoleService;
exports.ConsoleService = ConsoleService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(ssh_session_entity_1.SshSession)),
    __param(1, (0, typeorm_1.InjectRepository)(console_log_entity_1.ConsoleLog)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        axios_1.HttpService,
        config_1.ConfigService,
        logs_service_1.LogsService])
], ConsoleService);
//# sourceMappingURL=console.service.js.map