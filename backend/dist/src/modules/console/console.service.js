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
const ssh2_1 = require("ssh2");
const crypto = require("crypto");
const ssh_session_entity_1 = require("../../entities/ssh-session.entity");
const console_log_entity_1 = require("../../entities/console-log.entity");
let ConsoleService = class ConsoleService {
    constructor(sshSessionRepository, consoleLogRepository) {
        this.sshSessionRepository = sshSessionRepository;
        this.consoleLogRepository = consoleLogRepository;
        this.activeConnections = new Map();
        this.connectionTimeout = 30 * 60 * 1000;
        setInterval(() => this.cleanupInactiveConnections(), 5 * 60 * 1000);
    }
    async onModuleInit() {
        await this.ensureDefaultSshSession();
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
            if (defaultAuthType === 'password' && !defaultPassword) {
                console.log('⚠️  SSH password authentication selected but SSH_DEFAULT_PASSWORD not found in .env');
                return;
            }
            if (defaultAuthType === 'key' && !defaultPrivateKeyPath) {
                console.log('⚠️  SSH key authentication selected but SSH_DEFAULT_PRIVATE_KEY_PATH not found in .env');
                return;
            }
            const existingSession = await this.sshSessionRepository.findOne({
                where: {
                    hostname: defaultHost,
                    port: parseInt(defaultPort),
                    username: defaultUser,
                    sessionName: 'Local Server'
                }
            });
            if (existingSession) {
                console.log('ℹ️  Default SSH session already exists');
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
                encryptedPassword = this.encrypt(defaultPassword);
            }
            else {
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
                description: `Sessão SSH padrão para servidor externo (${defaultHost})`,
                userId: adminUser.id,
                connectionOptions: {
                    readyTimeout: 20000,
                    keepaliveInterval: 60000
                }
            });
            await this.sshSessionRepository.save(defaultSession);
            console.log(`✅ Default SSH session created for external server: ${defaultHost} (${defaultAuthType})`);
        }
        catch (error) {
            console.error('❌ Error creating default SSH session:', error.message);
        }
    }
    async createSession(userId, createDto) {
        const encryptedPassword = createDto.password ? this.encrypt(createDto.password) : null;
        const encryptedPrivateKey = createDto.privateKey ? this.encrypt(createDto.privateKey) : null;
        const encryptedPassphrase = createDto.passphrase ? this.encrypt(createDto.passphrase) : null;
        const session = this.sshSessionRepository.create({
            ...createDto,
            userId,
            password: encryptedPassword,
            privateKey: encryptedPrivateKey,
            passphrase: encryptedPassphrase,
        });
        return await this.sshSessionRepository.save(session);
    }
    async findUserSessions(userId) {
        return await this.sshSessionRepository.find({
            where: { userId, isActive: true },
            order: { createdAt: 'DESC' },
        });
    }
    async findSessionById(userId, sessionId) {
        const session = await this.sshSessionRepository.findOne({
            where: { id: sessionId, userId },
        });
        if (!session) {
            throw new common_1.NotFoundException('Sessão SSH não encontrada');
        }
        return session;
    }
    async updateSession(userId, sessionId, updateDto) {
        const session = await this.findSessionById(userId, sessionId);
        if (updateDto.password) {
            updateDto.password = this.encrypt(updateDto.password);
        }
        if (updateDto.privateKey) {
            updateDto.privateKey = this.encrypt(updateDto.privateKey);
        }
        if (updateDto.passphrase) {
            updateDto.passphrase = this.encrypt(updateDto.passphrase);
        }
        Object.assign(session, updateDto);
        return await this.sshSessionRepository.save(session);
    }
    async deleteSession(userId, sessionId) {
        const session = await this.findSessionById(userId, sessionId);
        const connectionKey = `${userId}:${sessionId}`;
        if (this.activeConnections.has(connectionKey)) {
            const connection = this.activeConnections.get(connectionKey);
            connection.client.end();
            this.activeConnections.delete(connectionKey);
        }
        await this.sshSessionRepository.remove(session);
    }
    async connectToSession(userId, sessionId) {
        const session = await this.sshSessionRepository.findOne({
            where: { id: sessionId, userId },
            select: ['id', 'hostname', 'port', 'username', 'password', 'privateKey', 'passphrase', 'authType', 'connectionOptions'],
        });
        if (!session) {
            throw new common_1.NotFoundException('Sessão SSH não encontrada');
        }
        const connectionKey = `${userId}:${sessionId}`;
        if (this.activeConnections.has(connectionKey)) {
            const existingConnection = this.activeConnections.get(connectionKey);
            existingConnection.client.end();
            this.activeConnections.delete(connectionKey);
        }
        return new Promise((resolve, reject) => {
            const client = new ssh2_1.Client();
            client.on('ready', async () => {
                await this.sshSessionRepository.update(sessionId, {
                    status: 'active',
                    lastConnectedAt: new Date(),
                    lastError: null,
                });
                this.activeConnections.set(connectionKey, {
                    client,
                    sessionId,
                    userId,
                    connectedAt: new Date(),
                    lastActivity: new Date(),
                });
                resolve(true);
            });
            client.on('error', async (err) => {
                await this.sshSessionRepository.update(sessionId, {
                    status: 'error',
                    lastError: err.message,
                });
                reject(new common_1.BadRequestException(`Erro de conexão SSH: ${err.message}`));
            });
            client.on('end', async () => {
                await this.sshSessionRepository.update(sessionId, {
                    status: 'disconnected',
                    lastDisconnectedAt: new Date(),
                });
                this.activeConnections.delete(connectionKey);
            });
            const config = {
                host: session.hostname,
                port: session.port,
                username: session.username,
                readyTimeout: 20000,
                keepaliveInterval: 60000,
                ...session.connectionOptions,
            };
            if (session.authType === 'password') {
                config.password = this.decrypt(session.password);
            }
            else {
                config.privateKey = this.decrypt(session.privateKey);
                if (session.passphrase) {
                    config.passphrase = this.decrypt(session.passphrase);
                }
            }
            client.connect(config);
        });
    }
    async disconnectSession(userId, sessionId) {
        const connectionKey = `${userId}:${sessionId}`;
        if (this.activeConnections.has(connectionKey)) {
            const connection = this.activeConnections.get(connectionKey);
            connection.client.end();
            this.activeConnections.delete(connectionKey);
            await this.sshSessionRepository.update(sessionId, {
                status: 'disconnected',
                lastDisconnectedAt: new Date(),
            });
        }
    }
    async executeCommand(userId, executeDto) {
        const connectionKey = `${userId}:${executeDto.sessionId}`;
        const connection = this.activeConnections.get(connectionKey);
        if (!connection) {
            throw new common_1.BadRequestException('Conexão SSH não encontrada. Conecte-se primeiro.');
        }
        const startTime = Date.now();
        return new Promise((resolve, reject) => {
            let fullCommand = executeDto.command;
            if (executeDto.workingDirectory) {
                fullCommand = `cd "${executeDto.workingDirectory}" && ${executeDto.command}`;
            }
            if (executeDto.environment && Object.keys(executeDto.environment).length > 0) {
                const envVars = Object.entries(executeDto.environment)
                    .map(([key, value]) => `${key}="${value}"`)
                    .join(' ');
                fullCommand = `${envVars} ${fullCommand}`;
            }
            connection.client.exec(fullCommand, (err, stream) => {
                if (err) {
                    reject(new common_1.BadRequestException(`Erro ao executar comando: ${err.message}`));
                    return;
                }
                let output = '';
                let errorOutput = '';
                stream.on('close', async (code, signal) => {
                    const executionTime = Date.now() - startTime;
                    connection.lastActivity = new Date();
                    await this.sshSessionRepository.increment({ id: executeDto.sessionId }, 'commandCount', 1);
                    const consoleLog = this.consoleLogRepository.create({
                        command: executeDto.command,
                        output,
                        errorOutput,
                        exitCode: code || 0,
                        executionTime,
                        status: 'completed',
                        workingDirectory: executeDto.workingDirectory || '~',
                        environment: executeDto.environment || {},
                        sessionId: executeDto.sessionId,
                        userId,
                        metadata: {
                            signal,
                            startTime: new Date(startTime),
                            endTime: new Date(),
                        },
                    });
                    const savedLog = await this.consoleLogRepository.save(consoleLog);
                    resolve(savedLog);
                });
                stream.on('data', (data) => {
                    output += data.toString();
                });
                stream.stderr.on('data', (data) => {
                    errorOutput += data.toString();
                });
                if (executeDto.timeout) {
                    setTimeout(() => {
                        stream.destroy();
                        reject(new common_1.BadRequestException('Comando excedeu o tempo limite'));
                    }, executeDto.timeout);
                }
            });
        });
    }
    async getCommandLogs(userId, sessionId, page = 1, limit = 50) {
        const [logs, total] = await this.consoleLogRepository.findAndCount({
            where: { userId, sessionId },
            order: { executedAt: 'DESC' },
            take: limit,
            skip: (page - 1) * limit,
        });
        return { logs, total };
    }
    isSessionConnected(userId, sessionId) {
        const connectionKey = `${userId}:${sessionId}`;
        return this.activeConnections.has(connectionKey);
    }
    async getUserSessionStats(userId) {
        const totalSessions = await this.sshSessionRepository.count({ where: { userId } });
        const activeSessions = await this.sshSessionRepository.count({
            where: { userId, status: 'active' }
        });
        const totalCommands = await this.consoleLogRepository.count({ where: { userId } });
        const connectedSessions = Array.from(this.activeConnections.values())
            .filter(conn => conn.userId === userId).length;
        return {
            totalSessions,
            activeSessions,
            connectedSessions,
            totalCommands,
        };
    }
    cleanupInactiveConnections() {
        const now = Date.now();
        for (const [key, connection] of this.activeConnections.entries()) {
            const timeSinceLastActivity = now - connection.lastActivity.getTime();
            if (timeSinceLastActivity > this.connectionTimeout) {
                connection.client.end();
                this.activeConnections.delete(key);
                this.sshSessionRepository.update(connection.sessionId, {
                    status: 'disconnected',
                    lastDisconnectedAt: new Date(),
                });
            }
        }
    }
    encrypt(text) {
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(process.env.JWT_SECRET || 'default-secret', 'salt', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(algorithm, key);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }
    decrypt(encryptedText) {
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(process.env.JWT_SECRET || 'default-secret', 'salt', 32);
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
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ConsoleService);
//# sourceMappingURL=console.service.js.map