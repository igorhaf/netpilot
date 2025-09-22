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
var WebSocketGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const websocket_service_1 = require("./services/websocket.service");
const ssh_websocket_handler_1 = require("./handlers/ssh-websocket.handler");
const docker_websocket_handler_1 = require("./handlers/docker-websocket.handler");
const websocket_rate_limit_guard_1 = require("./guards/websocket-rate-limit.guard");
let WebSocketGateway = WebSocketGateway_1 = class WebSocketGateway {
    constructor(jwtService, webSocketService, sshHandler, dockerHandler) {
        this.jwtService = jwtService;
        this.webSocketService = webSocketService;
        this.sshHandler = sshHandler;
        this.dockerHandler = dockerHandler;
        this.logger = new common_1.Logger(WebSocketGateway_1.name);
    }
    afterInit(server) {
        this.logger.log('Unified WebSocket Gateway initialized');
        this.webSocketService.setServer(server);
        this.sshHandler.setServer(server);
        this.dockerHandler.setServer(server);
    }
    async handleConnection(client) {
        try {
            const token = this.extractToken(client);
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
            this.webSocketService.addClientConnection(userId, client.id);
            this.logger.log(`Client ${client.id} connected for user ${userId}`);
            client.emit('connection:established', {
                clientId: client.id,
                userId,
                timestamp: new Date()
            });
        }
        catch (error) {
            this.logger.error(`Connection error for client ${client.id}:`, error);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        if (client.userId) {
            this.webSocketService.removeClientConnection(client.userId, client.id);
            this.logger.log(`Client ${client.id} disconnected for user ${client.userId}`);
        }
    }
    async handleSshConnect(client, data) {
        return this.sshHandler.handleConnect(client, data);
    }
    async handleSshDisconnect(client, data) {
        return this.sshHandler.handleDisconnect(client, data);
    }
    async handleSshCommand(client, data) {
        return this.sshHandler.handleCommand(client, data);
    }
    handleSshResize(client, data) {
        return this.sshHandler.handleResize(client, data);
    }
    async handleSshJoin(client, data) {
        return this.sshHandler.handleJoin(client, data);
    }
    handleSshLeave(client, data) {
        return this.sshHandler.handleLeave(client, data);
    }
    async handleDockerLogsStart(client, data) {
        return this.dockerHandler.handleLogsStart(client, data);
    }
    async handleDockerLogsStop(client, data) {
        return this.dockerHandler.handleLogsStop(client, data);
    }
    async handleDockerStatsStart(client, data) {
        return this.dockerHandler.handleStatsStart(client, data);
    }
    async handleDockerStatsStop(client, data) {
        return this.dockerHandler.handleStatsStop(client, data);
    }
    async handleDockerExecStart(client, data) {
        return this.dockerHandler.handleExecStart(client, data);
    }
    async handleDockerExecInput(client, data) {
        return this.dockerHandler.handleExecInput(client, data);
    }
    async handleDockerExecResize(client, data) {
        return this.dockerHandler.handleExecResize(client, data);
    }
    async handleDockerExecStop(client, data) {
        return this.dockerHandler.handleExecStop(client, data);
    }
    handlePing(client) {
        client.emit('pong', { timestamp: new Date() });
    }
    handleJoinRoom(client, data) {
        client.join(data.room);
        client.emit('room:joined', { room: data.room });
    }
    handleLeaveRoom(client, data) {
        client.leave(data.room);
        client.emit('room:left', { room: data.room });
    }
    extractToken(client) {
        return (client.handshake.auth?.token ||
            client.handshake.headers?.authorization?.replace('Bearer ', '') ||
            client.handshake.query?.token ||
            null);
    }
    async validateTokenAndGetUserId(token) {
        try {
            const payload = this.jwtService.verify(token, {
                secret: process.env.JWT_SECRET
            });
            return payload.sub || payload.userId;
        }
        catch (error) {
            this.logger.warn(`JWT validation failed: ${error.message}`);
            return null;
        }
    }
};
exports.WebSocketGateway = WebSocketGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], WebSocketGateway.prototype, "server", void 0);
__decorate([
    (0, common_1.UseGuards)(websocket_rate_limit_guard_1.WebSocketRateLimitGuard),
    (0, websocket_rate_limit_guard_1.ConnectionRateLimit)(),
    (0, websockets_1.SubscribeMessage)('ssh:connect'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebSocketGateway.prototype, "handleSshConnect", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ssh:disconnect'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebSocketGateway.prototype, "handleSshDisconnect", null);
__decorate([
    (0, common_1.UseGuards)(websocket_rate_limit_guard_1.WebSocketRateLimitGuard),
    (0, websocket_rate_limit_guard_1.CommandRateLimit)(),
    (0, websockets_1.SubscribeMessage)('ssh:command'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebSocketGateway.prototype, "handleSshCommand", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ssh:resize'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WebSocketGateway.prototype, "handleSshResize", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ssh:join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebSocketGateway.prototype, "handleSshJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ssh:leave'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WebSocketGateway.prototype, "handleSshLeave", null);
__decorate([
    (0, common_1.UseGuards)(websocket_rate_limit_guard_1.WebSocketRateLimitGuard),
    (0, websocket_rate_limit_guard_1.ModerateRateLimit)(),
    (0, websockets_1.SubscribeMessage)('docker:logs:start'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebSocketGateway.prototype, "handleDockerLogsStart", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('docker:logs:stop'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebSocketGateway.prototype, "handleDockerLogsStop", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('docker:stats:start'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebSocketGateway.prototype, "handleDockerStatsStart", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('docker:stats:stop'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebSocketGateway.prototype, "handleDockerStatsStop", null);
__decorate([
    (0, common_1.UseGuards)(websocket_rate_limit_guard_1.WebSocketRateLimitGuard),
    (0, websocket_rate_limit_guard_1.ConnectionRateLimit)(),
    (0, websockets_1.SubscribeMessage)('docker:exec:start'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebSocketGateway.prototype, "handleDockerExecStart", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('docker:exec:input'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebSocketGateway.prototype, "handleDockerExecInput", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('docker:exec:resize'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebSocketGateway.prototype, "handleDockerExecResize", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('docker:exec:stop'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebSocketGateway.prototype, "handleDockerExecStop", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ping'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WebSocketGateway.prototype, "handlePing", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('join:room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WebSocketGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave:room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WebSocketGateway.prototype, "handleLeaveRoom", null);
exports.WebSocketGateway = WebSocketGateway = WebSocketGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: (origin, callback) => {
                const allowedOrigins = [
                    process.env.FRONTEND_URL || 'http://localhost:3000',
                    'https://netpilot.meadadigital.com',
                    'https://netpilot.meadadigital.com:3000',
                    'http://netpilot.meadadigital.com',
                    'http://netpilot.meadadigital.com:3000',
                    'http://localhost:3000',
                    'http://meadadigital.com:3000'
                ];
                if (!origin)
                    return callback(null, true);
                if (allowedOrigins.includes(origin)) {
                    callback(null, true);
                }
                else {
                    console.warn(`WebSocket CORS: Blocked origin ${origin}`);
                    callback(new Error('Not allowed by CORS'), false);
                }
            },
            credentials: true,
        },
        allowEIO3: true
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        websocket_service_1.WebSocketService,
        ssh_websocket_handler_1.SshWebSocketHandler,
        docker_websocket_handler_1.DockerWebSocketHandler])
], WebSocketGateway);
//# sourceMappingURL=websocket.gateway.js.map