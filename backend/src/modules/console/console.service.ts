import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from 'ssh2';
import * as crypto from 'crypto';
import { SshSession } from '../../entities/ssh-session.entity';
import { ConsoleLog } from '../../entities/console-log.entity';
import { CreateSshSessionDto, UpdateSshSessionDto, ExecuteCommandDto } from '../../dtos/ssh-session.dto';

interface ActiveConnection {
    client: Client;
    sessionId: string;
    userId: string;
    connectedAt: Date;
    lastActivity: Date;
}

@Injectable()
export class ConsoleService {
    private activeConnections: Map<string, ActiveConnection> = new Map();
    private readonly connectionTimeout = 30 * 60 * 1000; // 30 minutos

    constructor(
        @InjectRepository(SshSession)
        private readonly sshSessionRepository: Repository<SshSession>,
        @InjectRepository(ConsoleLog)
        private readonly consoleLogRepository: Repository<ConsoleLog>,
    ) {
        // Limpar conexões inativas a cada 5 minutos
        setInterval(() => this.cleanupInactiveConnections(), 5 * 60 * 1000);
    }

    // Criar nova sessão SSH
    async createSession(userId: string, createDto: CreateSshSessionDto): Promise<SshSession> {
        // Criptografar senha/chave privada
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

    // Listar sessões do usuário
    async findUserSessions(userId: string): Promise<SshSession[]> {
        return await this.sshSessionRepository.find({
            where: { userId, isActive: true },
            order: { createdAt: 'DESC' },
        });
    }

    // Obter sessão por ID
    async findSessionById(userId: string, sessionId: string): Promise<SshSession> {
        const session = await this.sshSessionRepository.findOne({
            where: { id: sessionId, userId },
        });

        if (!session) {
            throw new NotFoundException('Sessão SSH não encontrada');
        }

        return session;
    }

    // Atualizar sessão
    async updateSession(
        userId: string,
        sessionId: string,
        updateDto: UpdateSshSessionDto,
    ): Promise<SshSession> {
        const session = await this.findSessionById(userId, sessionId);

        // Criptografar novos dados sensíveis se fornecidos
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

    // Deletar sessão
    async deleteSession(userId: string, sessionId: string): Promise<void> {
        const session = await this.findSessionById(userId, sessionId);

        // Fechar conexão se estiver ativa
        const connectionKey = `${userId}:${sessionId}`;
        if (this.activeConnections.has(connectionKey)) {
            const connection = this.activeConnections.get(connectionKey);
            connection.client.end();
            this.activeConnections.delete(connectionKey);
        }

        await this.sshSessionRepository.remove(session);
    }

    // Conectar à sessão SSH
    async connectToSession(userId: string, sessionId: string): Promise<boolean> {
        const session = await this.sshSessionRepository.findOne({
            where: { id: sessionId, userId },
            select: ['id', 'hostname', 'port', 'username', 'password', 'privateKey', 'passphrase', 'authType', 'connectionOptions'],
        });

        if (!session) {
            throw new NotFoundException('Sessão SSH não encontrada');
        }

        const connectionKey = `${userId}:${sessionId}`;

        // Se já existe uma conexão ativa, fechar antes de criar nova
        if (this.activeConnections.has(connectionKey)) {
            const existingConnection = this.activeConnections.get(connectionKey);
            existingConnection.client.end();
            this.activeConnections.delete(connectionKey);
        }

        return new Promise((resolve, reject) => {
            const client = new Client();

            client.on('ready', async () => {
                // Atualizar status da sessão
                await this.sshSessionRepository.update(sessionId, {
                    status: 'active',
                    lastConnectedAt: new Date(),
                    lastError: null,
                });

                // Armazenar conexão ativa
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

                reject(new BadRequestException(`Erro de conexão SSH: ${err.message}`));
            });

            client.on('end', async () => {
                await this.sshSessionRepository.update(sessionId, {
                    status: 'disconnected',
                    lastDisconnectedAt: new Date(),
                });

                this.activeConnections.delete(connectionKey);
            });

            // Configurar conexão
            const config: any = {
                host: session.hostname,
                port: session.port,
                username: session.username,
                readyTimeout: 20000,
                keepaliveInterval: 60000,
                ...session.connectionOptions,
            };

            if (session.authType === 'password') {
                config.password = this.decrypt(session.password);
            } else {
                config.privateKey = this.decrypt(session.privateKey);
                if (session.passphrase) {
                    config.passphrase = this.decrypt(session.passphrase);
                }
            }

            client.connect(config);
        });
    }

    // Desconectar da sessão
    async disconnectSession(userId: string, sessionId: string): Promise<void> {
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

    // Executar comando SSH
    async executeCommand(userId: string, executeDto: ExecuteCommandDto): Promise<ConsoleLog> {
        const connectionKey = `${userId}:${executeDto.sessionId}`;
        const connection = this.activeConnections.get(connectionKey);

        if (!connection) {
            throw new BadRequestException('Conexão SSH não encontrada. Conecte-se primeiro.');
        }

        const startTime = Date.now();

        return new Promise((resolve, reject) => {
            // Preparar comando com diretório de trabalho e variáveis de ambiente para SSH
            let fullCommand = executeDto.command;

            // Adicionar mudança de diretório se especificado
            if (executeDto.workingDirectory) {
                fullCommand = `cd "${executeDto.workingDirectory}" && ${executeDto.command}`;
            }

            // Adicionar variáveis de ambiente se especificadas
            if (executeDto.environment && Object.keys(executeDto.environment).length > 0) {
                const envVars = Object.entries(executeDto.environment)
                    .map(([key, value]) => `${key}="${value}"`)
                    .join(' ');
                fullCommand = `${envVars} ${fullCommand}`;
            }

            connection.client.exec(fullCommand, (err, stream) => {
                if (err) {
                    reject(new BadRequestException(`Erro ao executar comando: ${err.message}`));
                    return;
                }

                let output = '';
                let errorOutput = '';

                stream.on('close', async (code, signal) => {
                    const executionTime = Date.now() - startTime;

                    // Atualizar atividade da conexão
                    connection.lastActivity = new Date();

                    // Incrementar contador de comandos
                    await this.sshSessionRepository.increment(
                        { id: executeDto.sessionId },
                        'commandCount',
                        1
                    );

                    // Salvar log da execução
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

                stream.on('data', (data: Buffer) => {
                    output += data.toString();
                });

                stream.stderr.on('data', (data: Buffer) => {
                    errorOutput += data.toString();
                });

                // Timeout opcional
                if (executeDto.timeout) {
                    setTimeout(() => {
                        stream.destroy();
                        reject(new BadRequestException('Comando excedeu o tempo limite'));
                    }, executeDto.timeout);
                }
            });
        });
    }

    // Obter logs de comandos
    async getCommandLogs(
        userId: string,
        sessionId: string,
        page: number = 1,
        limit: number = 50
    ): Promise<{ logs: ConsoleLog[], total: number }> {
        const [logs, total] = await this.consoleLogRepository.findAndCount({
            where: { userId, sessionId },
            order: { executedAt: 'DESC' },
            take: limit,
            skip: (page - 1) * limit,
        });

        return { logs, total };
    }

    // Verificar se sessão está conectada
    isSessionConnected(userId: string, sessionId: string): boolean {
        const connectionKey = `${userId}:${sessionId}`;
        return this.activeConnections.has(connectionKey);
    }

    // Obter estatísticas das sessões
    async getUserSessionStats(userId: string) {
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

    // Limpar conexões inativas
    private cleanupInactiveConnections(): void {
        const now = Date.now();

        for (const [key, connection] of this.activeConnections.entries()) {
            const timeSinceLastActivity = now - connection.lastActivity.getTime();

            if (timeSinceLastActivity > this.connectionTimeout) {
                connection.client.end();
                this.activeConnections.delete(key);

                // Atualizar status no banco
                this.sshSessionRepository.update(connection.sessionId, {
                    status: 'disconnected',
                    lastDisconnectedAt: new Date(),
                });
            }
        }
    }

    // Utilitários de criptografia
    private encrypt(text: string): string {
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(process.env.JWT_SECRET || 'default-secret', 'salt', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(algorithm, key);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }

    private decrypt(encryptedText: string): string {
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(process.env.JWT_SECRET || 'default-secret', 'salt', 32);
        const textParts = encryptedText.split(':');
        const iv = Buffer.from(textParts.shift()!, 'hex');
        const encryptedData = textParts.join(':');
        const decipher = crypto.createDecipher(algorithm, key);
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
