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
var SshWebSocketHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SshWebSocketHandler = void 0;
const common_1 = require("@nestjs/common");
const ssh2_1 = require("ssh2");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ssh_session_entity_1 = require("../../../entities/ssh-session.entity");
const console_log_entity_1 = require("../../../entities/console-log.entity");
const console_service_1 = require("../../console/console.service");
let SshWebSocketHandler = SshWebSocketHandler_1 = class SshWebSocketHandler {
    constructor(sshSessionRepository, consoleLogRepository, consoleService) {
        this.sshSessionRepository = sshSessionRepository;
        this.consoleLogRepository = consoleLogRepository;
        this.consoleService = consoleService;
        this.logger = new common_1.Logger(SshWebSocketHandler_1.name);
        this.activeConnections = new Map();
        setInterval(() => this.cleanupInactiveConnections(), 5 * 60 * 1000);
    }
    setServer(server) {
        this.server = server;
    }
    async handleConnect(client, data) {
        try {
            if (!client.userId) {
                client.emit('ssh:error', { message: 'Not authenticated' });
                return;
            }
            const session = await this.sshSessionRepository.findOne({
                where: { id: data.sessionId, userId: client.userId }
            });
            if (!session) {
                client.emit('ssh:error', {
                    sessionId: data.sessionId,
                    message: 'Session not found'
                });
                return;
            }
            const connectionKey = `${client.userId}:${data.sessionId}`;
            if (this.activeConnections.has(connectionKey)) {
                const existing = this.activeConnections.get(connectionKey);
                existing.client.end();
                this.activeConnections.delete(connectionKey);
            }
            const sshClient = new ssh2_1.Client();
            const connection = {
                client: sshClient,
                sessionId: data.sessionId,
                userId: client.userId,
                connectedAt: new Date(),
                lastActivity: new Date()
            };
            sshClient.on('ready', () => {
                this.logger.log(`SSH connection established for session ${data.sessionId}`);
                sshClient.shell((err, stream) => {
                    if (err) {
                        this.logger.error(`Failed to start shell for session ${data.sessionId}:`, err);
                        client.emit('ssh:error', {
                            sessionId: data.sessionId,
                            message: 'Failed to start shell'
                        });
                        return;
                    }
                    connection.stream = stream;
                    this.activeConnections.set(connectionKey, connection);
                    client.join(`ssh:${data.sessionId}`);
                    client.emit('ssh:connected', { sessionId: data.sessionId });
                    stream.on('data', (chunk) => {
                        connection.lastActivity = new Date();
                        client.emit('ssh:data', {
                            sessionId: data.sessionId,
                            data: chunk.toString()
                        });
                    });
                    stream.on('close', () => {
                        this.logger.log(`SSH stream closed for session ${data.sessionId}`);
                        client.emit('ssh:disconnected', { sessionId: data.sessionId });
                        this.activeConnections.delete(connectionKey);
                    });
                    stream.stderr.on('data', (chunk) => {
                        connection.lastActivity = new Date();
                        client.emit('ssh:data', {
                            sessionId: data.sessionId,
                            data: chunk.toString(),
                            stderr: true
                        });
                    });
                });
            });
            sshClient.on('error', (err) => {
                this.logger.error(`SSH connection error for session ${data.sessionId}:`, err);
                client.emit('ssh:error', {
                    sessionId: data.sessionId,
                    message: err.message
                });
                this.activeConnections.delete(connectionKey);
            });
            sshClient.on('close', () => {
                this.logger.log(`SSH connection closed for session ${data.sessionId}`);
                client.emit('ssh:disconnected', { sessionId: data.sessionId });
                this.activeConnections.delete(connectionKey);
            });
            const connectConfig = {
                host: session.hostname,
                port: session.port,
                username: session.username
            };
            if (session.password) {
                connectConfig.password = session.password;
            }
            else if (session.privateKey) {
                connectConfig.privateKey = session.privateKey;
                if (session.passphrase) {
                    connectConfig.passphrase = session.passphrase;
                }
            }
            sshClient.connect(connectConfig);
        }
        catch (error) {
            this.logger.error(`SSH connect error:`, error);
            client.emit('ssh:error', {
                sessionId: data.sessionId,
                message: error.message
            });
        }
    }
    async handleDisconnect(client, data) {
        try {
            if (!client.userId)
                return;
            const connectionKey = `${client.userId}:${data.sessionId}`;
            const connection = this.activeConnections.get(connectionKey);
            if (connection) {
                connection.client.end();
                this.activeConnections.delete(connectionKey);
            }
            client.leave(`ssh:${data.sessionId}`);
            client.emit('ssh:disconnected', { sessionId: data.sessionId });
        }
        catch (error) {
            this.logger.error(`SSH disconnect error:`, error);
        }
    }
    async handleCommand(client, data) {
        try {
            if (!client.userId) {
                client.emit('ssh:error', { message: 'Not authenticated' });
                return;
            }
            const connectionKey = `${client.userId}:${data.sessionId}`;
            const connection = this.activeConnections.get(connectionKey);
            if (!connection || !connection.stream) {
                client.emit('ssh:error', {
                    sessionId: data.sessionId,
                    message: 'No active SSH connection'
                });
                return;
            }
            const startTime = Date.now();
            connection.lastActivity = new Date();
            connection.stream.write(data.command + '\n');
            client.emit('ssh:command:sent', {
                sessionId: data.sessionId,
                requestId: data.requestId,
                command: data.command,
                timestamp: new Date()
            });
            const consoleLog = this.consoleLogRepository.create({
                sessionId: data.sessionId,
                userId: client.userId,
                command: data.command,
                executedAt: new Date(),
                executionTime: Date.now() - startTime,
                status: 'completed',
                workingDirectory: '~',
                exitCode: 0,
                output: '',
                errorOutput: ''
            });
            await this.consoleLogRepository.save(consoleLog);
        }
        catch (error) {
            this.logger.error(`SSH command error:`, error);
            client.emit('ssh:error', {
                sessionId: data.sessionId,
                message: error.message
            });
        }
    }
    handleResize(client, data) {
        try {
            if (!client.userId)
                return;
            const connectionKey = `${client.userId}:${data.sessionId}`;
            const connection = this.activeConnections.get(connectionKey);
            if (connection && connection.stream) {
                connection.stream.setWindow(data.rows, data.cols);
                connection.lastActivity = new Date();
                client.to(`ssh:${data.sessionId}`).emit('ssh:resize', {
                    sessionId: data.sessionId,
                    cols: data.cols,
                    rows: data.rows
                });
            }
        }
        catch (error) {
            this.logger.error(`SSH resize error:`, error);
        }
    }
    async handleJoin(client, data) {
        try {
            if (!client.userId)
                return;
            const session = await this.sshSessionRepository.findOne({
                where: { id: data.sessionId, userId: client.userId }
            });
            if (!session) {
                client.emit('ssh:error', {
                    sessionId: data.sessionId,
                    message: 'Session not found'
                });
                return;
            }
            client.join(`ssh:${data.sessionId}`);
            client.emit('ssh:joined', { sessionId: data.sessionId });
            const connectionKey = `${client.userId}:${data.sessionId}`;
            const isConnected = this.activeConnections.has(connectionKey);
            client.emit('ssh:status', {
                sessionId: data.sessionId,
                status: isConnected ? 'connected' : 'disconnected'
            });
        }
        catch (error) {
            this.logger.error(`SSH join error:`, error);
            client.emit('ssh:error', {
                sessionId: data.sessionId,
                message: error.message
            });
        }
    }
    handleLeave(client, data) {
        client.leave(`ssh:${data.sessionId}`);
        client.emit('ssh:left', { sessionId: data.sessionId });
    }
    cleanupInactiveConnections() {
        const now = new Date();
        const timeout = 30 * 60 * 1000;
        for (const [key, connection] of this.activeConnections) {
            const timeSinceActivity = now.getTime() - connection.lastActivity.getTime();
            if (timeSinceActivity > timeout) {
                this.logger.log(`Cleaning up inactive SSH connection: ${key}`);
                connection.client.end();
                this.activeConnections.delete(key);
            }
        }
    }
    getActiveConnections() {
        return this.activeConnections;
    }
    emitToSession(sessionId, event, data) {
        if (this.server) {
            this.server.to(`ssh:${sessionId}`).emit(event, data);
        }
    }
};
exports.SshWebSocketHandler = SshWebSocketHandler;
exports.SshWebSocketHandler = SshWebSocketHandler = SshWebSocketHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(ssh_session_entity_1.SshSession)),
    __param(1, (0, typeorm_1.InjectRepository)(console_log_entity_1.ConsoleLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        console_service_1.ConsoleService])
], SshWebSocketHandler);
//# sourceMappingURL=ssh-websocket.handler.js.map