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
var ConsoleGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const console_service_1 = require("./console.service");
let ConsoleGateway = ConsoleGateway_1 = class ConsoleGateway {
    constructor(consoleService, jwtService) {
        this.consoleService = consoleService;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger(ConsoleGateway_1.name);
        this.userSockets = new Map();
    }
    afterInit(server) {
        this.logger.log('Console WebSocket Gateway initialized');
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '');
            if (!token) {
                this.logger.warn(`Client ${client.id} connected without token`);
                client.disconnect();
                return;
            }
            const userId = await this.validateTokenAndGetUserId(token);
            if (!userId) {
                this.logger.warn(`Client ${client.id} provided invalid token`);
                client.disconnect();
                return;
            }
            client.userId = userId;
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, new Set());
            }
            this.userSockets.get(userId).add(client.id);
            const userSessions = await this.consoleService.findUserSessions(userId);
            for (const session of userSessions) {
                client.join(`session:${session.id}`);
            }
            this.logger.log(`Client ${client.id} connected for user ${userId}`);
            const stats = await this.consoleService.getUserSessionStats(userId);
            client.emit('session:stats', stats);
        }
        catch (error) {
            this.logger.error(`Connection error for client ${client.id}:`, error);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        if (client.userId) {
            const userSocketSet = this.userSockets.get(client.userId);
            if (userSocketSet) {
                userSocketSet.delete(client.id);
                if (userSocketSet.size === 0) {
                    this.userSockets.delete(client.userId);
                }
            }
            this.logger.log(`Client ${client.id} disconnected for user ${client.userId}`);
        }
    }
    async handleSessionConnect(client, data) {
        try {
            if (!client.userId) {
                client.emit('error', { message: 'Não autenticado' });
                return;
            }
            const connected = await this.consoleService.connectToSession(client.userId, data.sessionId);
            if (connected) {
                client.join(`session:${data.sessionId}`);
                client.emit('session:connected', { sessionId: data.sessionId });
                this.broadcastToUser(client.userId, 'session:status', {
                    sessionId: data.sessionId,
                    status: 'connected'
                });
            }
        }
        catch (error) {
            client.emit('session:error', {
                sessionId: data.sessionId,
                message: error.message
            });
        }
    }
    async handleSessionDisconnect(client, data) {
        try {
            if (!client.userId)
                return;
            await this.consoleService.disconnectSession(client.userId, data.sessionId);
            client.leave(`session:${data.sessionId}`);
            client.emit('session:disconnected', { sessionId: data.sessionId });
            this.broadcastToUser(client.userId, 'session:status', {
                sessionId: data.sessionId,
                status: 'disconnected'
            });
        }
        catch (error) {
            client.emit('session:error', {
                sessionId: data.sessionId,
                message: error.message
            });
        }
    }
    async handleCommandExecute(client, data) {
        try {
            if (!client.userId) {
                client.emit('error', { message: 'Não autenticado' });
                return;
            }
            client.emit('command:executing', {
                requestId: data.requestId,
                command: data.command,
                sessionId: data.sessionId
            });
            const result = await this.consoleService.executeCommand(client.userId, data);
            client.emit('command:result', {
                requestId: data.requestId,
                logId: result.id,
                command: result.command,
                output: result.output,
                errorOutput: result.errorOutput,
                exitCode: result.exitCode,
                executionTime: result.executionTime,
                status: result.status,
                executedAt: result.executedAt
            });
            this.server.to(`session:${data.sessionId}`).emit('session:activity', {
                sessionId: data.sessionId,
                userId: client.userId,
                command: data.command,
                timestamp: new Date()
            });
        }
        catch (error) {
            client.emit('command:error', {
                requestId: data.requestId,
                command: data.command,
                sessionId: data.sessionId,
                message: error.message
            });
        }
    }
    async handleJoinSession(client, data) {
        if (!client.userId)
            return;
        try {
            await this.consoleService.findSessionById(client.userId, data.sessionId);
            client.join(`session:${data.sessionId}`);
            client.emit('session:joined', { sessionId: data.sessionId });
            const isConnected = this.consoleService.isSessionConnected(client.userId, data.sessionId);
            client.emit('session:status', {
                sessionId: data.sessionId,
                status: isConnected ? 'connected' : 'disconnected'
            });
        }
        catch (error) {
            client.emit('session:error', {
                sessionId: data.sessionId,
                message: 'Sessão não encontrada ou sem acesso'
            });
        }
    }
    handleLeaveSession(client, data) {
        client.leave(`session:${data.sessionId}`);
        client.emit('session:left', { sessionId: data.sessionId });
    }
    handleTerminalResize(client, data) {
        client.to(`session:${data.sessionId}`).emit('terminal:resize', {
            sessionId: data.sessionId,
            cols: data.cols,
            rows: data.rows
        });
    }
    handlePing(client) {
        client.emit('pong', { timestamp: new Date() });
    }
    async validateTokenAndGetUserId(token) {
        try {
            const payload = this.jwtService.verify(token);
            return payload.sub || payload.userId;
        }
        catch (error) {
            this.logger.warn(`JWT validation failed: ${error.message}`);
            return null;
        }
    }
    broadcastToUser(userId, event, data) {
        const userSocketSet = this.userSockets.get(userId);
        if (userSocketSet) {
            for (const socketId of userSocketSet) {
                this.server.to(socketId).emit(event, data);
            }
        }
    }
    emitToSession(sessionId, event, data) {
        this.server.to(`session:${sessionId}`).emit(event, data);
    }
    emitToUser(userId, event, data) {
        this.broadcastToUser(userId, event, data);
    }
};
exports.ConsoleGateway = ConsoleGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ConsoleGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('session:connect'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ConsoleGateway.prototype, "handleSessionConnect", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('session:disconnect'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ConsoleGateway.prototype, "handleSessionDisconnect", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('command:execute'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ConsoleGateway.prototype, "handleCommandExecute", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('session:join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ConsoleGateway.prototype, "handleJoinSession", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('session:leave'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ConsoleGateway.prototype, "handleLeaveSession", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('terminal:resize'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ConsoleGateway.prototype, "handleTerminalResize", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ping'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ConsoleGateway.prototype, "handlePing", null);
exports.ConsoleGateway = ConsoleGateway = ConsoleGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/console',
        cors: {
            origin: ['http://meadadigital.com:3000', 'https://meadadigital.com:3000'],
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [console_service_1.ConsoleService,
        jwt_1.JwtService])
], ConsoleGateway);
//# sourceMappingURL=console.gateway.js.map