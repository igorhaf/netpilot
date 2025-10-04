import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { SshSession } from '../../entities/ssh-session.entity';
import { ConsoleLog } from '../../entities/console-log.entity';
import { User } from '../../entities/user.entity';
import { CreateSshSessionDto, UpdateSshSessionDto, ExecuteCommandDto } from '../../dtos/ssh-session.dto';
import { LogsService } from '../logs/logs.service';
import { LogType, LogStatus } from '../../entities/log.entity';

@Injectable()
export class ConsoleService implements OnModuleInit {
    private readonly systemOpsUrl: string;
    private readonly systemOpsToken: string;

    constructor(
        @InjectRepository(SshSession)
        private readonly sshSessionRepository: Repository<SshSession>,
        @InjectRepository(ConsoleLog)
        private readonly consoleLogRepository: Repository<ConsoleLog>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        private readonly logsService: LogsService,
    ) {
        // URL do microserviço Python
        this.systemOpsUrl = this.configService.get('SYSTEM_OPS_URL', 'http://localhost:8001');
        this.systemOpsToken = this.configService.get('SYSTEM_OPS_TOKEN', 'netpilot-internal-token');
    }

    async onModuleInit() {
        // Verificar se microserviço Python está disponível
        await this.checkSystemOpsHealth();

        // Criar sessão SSH padrão se não existir
        await this.ensureDefaultSshSession();
    }

    // ========================
    // MÉTODOS MIGRADOS PARA PYTHON
    // ========================

    /**
     * Conectar-se a uma sessão SSH via microserviço Python
     */
    async connectToSession(userId: string, sessionId: string): Promise<{ success: boolean; message: string; connectionId?: string }> {
        try {
            // Buscar sessão no banco
            const session = await this.sshSessionRepository.findOne({
                where: { id: sessionId, userId, isActive: true }
            });

            if (!session) {
                throw new NotFoundException('Sessão SSH não encontrada ou não pertence ao usuário');
            }

            // Preparar dados para conexão Python
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

            // Chamar microserviço Python
            const response = await firstValueFrom(
                this.httpService.post(`${this.systemOpsUrl}/ssh/connect`, connectionRequest, {
                    headers: {
                        'Authorization': `Bearer ${this.systemOpsToken}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 60000 // 1 minuto
                })
            );

            const result = response.data as any;

            if (result.success) {
                // Atualizar sessão no banco
                await this.sshSessionRepository.update(sessionId, {
                    lastConnectedAt: new Date(),
                    status: 'active'
                });

                return {
                    success: true,
                    message: result.message,
                    connectionId: result.connectionId
                };
            } else {
                return {
                    success: false,
                    message: result.message
                };
            }

        } catch (error) {
            if (error.response?.status === 400) {
                throw new BadRequestException(error.response.data.detail || 'Erro na conexão SSH');
            }

            if (error.code === 'ECONNREFUSED') {
                throw new BadRequestException('Microserviço SSH não está disponível');
            }

            throw new BadRequestException(`Erro ao conectar SSH: ${error.message}`);
        }
    }

    /**
     * Executar comando SSH via microserviço Python
     */
    async executeCommand(userId: string, executeDto: ExecuteCommandDto): Promise<ConsoleLog> {
        try {
            // Validar se sessão existe e pertence ao usuário
            const session = await this.sshSessionRepository.findOne({
                where: { id: executeDto.sessionId, userId, isActive: true }
            });

            if (!session) {
                throw new BadRequestException('Sessão SSH não encontrada ou não pertence ao usuário');
            }

            // Preparar requisição para Python
            const commandRequest = {
                sessionId: executeDto.sessionId,
                command: executeDto.command,
                workingDirectory: executeDto.workingDirectory,
                environment: executeDto.environment || {},
                timeout: executeDto.timeout || 30,
                userId: userId
            };

            // Executar comando via Python
            const response = await firstValueFrom(
                this.httpService.post(`${this.systemOpsUrl}/ssh/execute`, commandRequest, {
                    headers: {
                        'Authorization': `Bearer ${this.systemOpsToken}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: (executeDto.timeout || 30) * 1000 + 10000 // Timeout do comando + 10s buffer
                })
            );

            const result = response.data as any;

            // Atualizar contador de comandos na sessão
            await this.sshSessionRepository.increment(
                { id: executeDto.sessionId },
                'commandCount',
                1
            );

            // Buscar informações do usuário para auditoria
            const user = await this.userRepository.findOne({ where: { id: userId } });

            // Salvar log da execução no banco local
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

            // Registrar no sistema de logs principal para auditoria
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
                output: result.output?.substring(0, 500), // Primeiros 500 chars do output
                errorOutput: result.errorOutput?.substring(0, 500)
            }, null, 2);

            const auditLog = await this.logsService.createLog(
                LogType.SYSTEM,
                logAction,
                logMessage,
                logDetails
            );

            // Atualizar status do log baseado no resultado
            await this.logsService.updateLogStatus(
                auditLog.id,
                result.success ? LogStatus.SUCCESS : LogStatus.FAILED
            );

            return savedLog;

        } catch (error) {
            if (error.response?.status === 400) {
                throw new BadRequestException(error.response.data.detail || 'Erro na execução do comando');
            }

            if (error.code === 'ECONNREFUSED') {
                throw new BadRequestException('Microserviço SSH não está disponível');
            }

            if (error.code === 'ETIMEDOUT') {
                throw new BadRequestException('Comando excedeu o tempo limite');
            }

            throw new BadRequestException(`Erro ao executar comando: ${error.message}`);
        }
    }

    /**
     * Desconectar sessão SSH via microserviço Python
     */
    async disconnectFromSession(userId: string, sessionId: string): Promise<{ success: boolean; message: string }> {
        try {
            // Validar se sessão existe e pertence ao usuário
            const session = await this.sshSessionRepository.findOne({
                where: { id: sessionId, userId, isActive: true }
            });

            if (!session) {
                throw new BadRequestException('Sessão SSH não encontrada ou não pertence ao usuário');
            }

            // Desconectar via Python
            const disconnectRequest = {
                sessionId: sessionId,
                userId: userId
            };

            const response = await firstValueFrom(
                this.httpService.post(`${this.systemOpsUrl}/ssh/disconnect`, disconnectRequest, {
                    headers: {
                        'Authorization': `Bearer ${this.systemOpsToken}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                })
            );

            const result = response.data as any;

            if (result.success) {
                // Atualizar status da sessão no banco
                await this.sshSessionRepository.update(sessionId, {
                    status: 'disconnected',
                    lastDisconnectedAt: new Date()
                });
            }

            return {
                success: result.success,
                message: result.message
            };

        } catch (error) {
            if (error.response?.status >= 400 && error.response?.status < 500) {
                throw new BadRequestException(error.response.data.detail || 'Erro na desconexão SSH');
            }

            throw new BadRequestException(`Erro ao desconectar SSH: ${error.message}`);
        }
    }

    /**
     * Listar sessões SSH ativas via microserviço Python
     */
    async getActiveSSHSessions(): Promise<any[]> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.systemOpsUrl}/ssh/sessions`, {
                    headers: {
                        'Authorization': `Bearer ${this.systemOpsToken}`
                    },
                    timeout: 10000
                })
            );

            return (response.data as any).sessions || [];

        } catch (error) {
            console.error('Erro ao obter sessões SSH ativas:', error.message);
            return [];
        }
    }

    // ========================
    // MÉTODOS DE COMPATIBILIDADE E ALIASES
    // ========================

    // Aliases para manter compatibilidade com controllers existentes
    async createSession(userId: string, createSshSessionDto: CreateSshSessionDto): Promise<SshSession> {
        return this.create(createSshSessionDto, userId);
    }

    async findUserSessions(userId: string): Promise<SshSession[]> {
        return this.findAll(userId);
    }

    async findSessionById(userId: string, id: string): Promise<SshSession> {
        return this.findOne(id, userId);
    }

    async updateSession(userId: string, id: string, updateSshSessionDto: UpdateSshSessionDto): Promise<SshSession> {
        return this.update(id, updateSshSessionDto, userId);
    }

    async deleteSession(userId: string, id: string): Promise<void> {
        return this.remove(id, userId);
    }

    async disconnectSession(userId: string, sessionId: string): Promise<{ success: boolean; message: string }> {
        return this.disconnectFromSession(userId, sessionId);
    }

    async getCommandLogs(userId: string, sessionId: string, page: number = 1, limit: number = 50): Promise<{
        logs: ConsoleLog[];
        total: number;
        page: number;
        totalPages: number;
    }> {
        return this.getCommandHistory(sessionId, userId, page, limit);
    }

    async getUserSessionStats(userId: string): Promise<any> {
        const sessions = await this.findAll(userId);
        const activeSessions = await this.getActiveSSHSessions();

        return {
            totalSessions: sessions.length,
            activeSessions: activeSessions.filter(s => sessions.some(us => us.id === s.sessionId)).length,
            lastActivity: sessions.length > 0 ? Math.max(...sessions.map(s => s.lastConnectedAt?.getTime() || 0)) : null
        };
    }

    isSessionConnected(userId: string, sessionId: string): boolean {
        // Para compatibilidade, sempre retorna false já que delegamos para Python
        return false;
    }

    // ========================
    // MÉTODOS DE COMPATIBILIDADE (mantidos inalterados)
    // ========================

    async create(createSshSessionDto: CreateSshSessionDto, userId: string): Promise<SshSession> {
        // Criptografar dados sensíveis
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

    async findAll(userId: string): Promise<SshSession[]> {
        const sessions = await this.sshSessionRepository.find({
            where: { userId, isActive: true },
            order: { createdAt: 'DESC' }
        });

        // Remover dados sensíveis do retorno
        return sessions.map(session => ({
            ...session,
            password: session.password ? '***' : null,
            privateKey: session.privateKey ? '***' : null,
            passphrase: session.passphrase ? '***' : null,
        }) as SshSession);
    }

    async findOne(id: string, userId: string): Promise<SshSession> {
        const session = await this.sshSessionRepository.findOne({
            where: { id, userId, isActive: true }
        });

        if (!session) {
            throw new NotFoundException('Sessão SSH não encontrada');
        }

        // Remover dados sensíveis do retorno
        return {
            ...session,
            password: session.password ? '***' : null,
            privateKey: session.privateKey ? '***' : null,
            passphrase: session.passphrase ? '***' : null,
        } as SshSession;
    }

    async update(id: string, updateSshSessionDto: UpdateSshSessionDto, userId: string): Promise<SshSession> {
        const session = await this.findOne(id, userId);

        // Criptografar novos dados sensíveis se fornecidos
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

    async remove(id: string, userId: string): Promise<void> {
        const session = await this.findOne(id, userId);

        // Primeiro desconectar se estiver conectada
        try {
            await this.disconnectFromSession(userId, id);
        } catch (error) {
            // Ignorar erros de desconexão na remoção
        }

        await this.sshSessionRepository.update(id, { isActive: false });
    }

    async getCommandHistory(sessionId: string, userId: string, page: number = 1, limit: number = 50): Promise<{
        logs: ConsoleLog[];
        total: number;
        page: number;
        totalPages: number;
    }> {
        // Verificar se a sessão pertence ao usuário
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

    // ========================
    // MÉTODOS AUXILIARES
    // ========================

    private async checkSystemOpsHealth(): Promise<void> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.systemOpsUrl}/ssh/health`, {
                    timeout: 5000
                })
            );

            if ((response.data as any).status !== 'healthy') {
                console.warn('⚠️ Microserviço SSH não está saudável:', (response.data as any).message);
            } else {
                console.log('✅ Microserviço SSH está saudável');
            }

        } catch (error) {
            console.error('❌ Microserviço SSH não está disponível:', error.message);
            throw new Error('Microserviço SSH não está disponível. Verifique se está executando na porta 3001.');
        }
    }

    private async ensureDefaultSshSession() {
        try {
            const defaultHost = process.env.SSH_DEFAULT_HOST;
            const defaultPort = process.env.SSH_DEFAULT_PORT || '22';
            const defaultUser = process.env.SSH_DEFAULT_USER || 'root';
            const defaultAuthType = (process.env.SSH_DEFAULT_AUTH_TYPE || 'password') as 'password' | 'key';
            const defaultPassword = process.env.SSH_DEFAULT_PASSWORD;
            const defaultPrivateKeyPath = process.env.SSH_DEFAULT_PRIVATE_KEY_PATH;
            const defaultPassphrase = process.env.SSH_DEFAULT_PASSPHRASE;

            if (!defaultHost) {
                console.log('⚠️  SSH_DEFAULT_HOST not found in .env, skipping default session creation');
                return;
            }

            // Verificar se já existe uma sessão padrão
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
            }) as any;

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
            } else {
                if (!defaultPrivateKeyPath) {
                    console.log('⚠️  SSH_DEFAULT_PRIVATE_KEY_PATH not found for key auth');
                    return;
                }

                // Ler chave privada do arquivo
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

        } catch (error) {
            console.error('❌ Error creating default SSH session:', error.message);
        }
    }

    private encrypt(text: string): string {
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(process.env.SSH_ENCRYPTION_KEY || 'netpilot-ssh-key', 'salt', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(algorithm, key);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return iv.toString('hex') + ':' + encrypted;
    }

    private decrypt(encryptedText: string): string {
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(process.env.SSH_ENCRYPTION_KEY || 'netpilot-ssh-key', 'salt', 32);

        const textParts = encryptedText.split(':');
        const iv = Buffer.from(textParts.shift()!, 'hex');
        const encryptedData = textParts.join(':');

        const decipher = crypto.createDecipher(algorithm, key);
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }
}