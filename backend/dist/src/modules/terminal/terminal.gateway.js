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
var TerminalGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const terminal_service_1 = require("./terminal.service");
function generateUUID() {
    return 'cmd-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
}
let TerminalGateway = TerminalGateway_1 = class TerminalGateway {
    constructor(terminalService) {
        this.terminalService = terminalService;
        this.logger = new common_1.Logger(TerminalGateway_1.name);
        this.clientCommands = new Map();
    }
    afterInit(server) {
        this.logger.log('[Terminal] Gateway initialized');
        this.terminalService.on('output', (output) => {
            this.logger.log(`[Terminal] Broadcasting: ${output.type} - ${output.data.substring(0, 50)}`);
            this.server.sockets.emit('commandOutput', output);
        });
    }
    handleConnection(client) {
        this.logger.log(`[Terminal] Client connected: ${client.id}`);
        console.log(`[Terminal Debug] Client connected: ${client.id}`);
        this.clientCommands.set(client.id, new Set());
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
        const commandIds = this.clientCommands.get(client.id);
        if (commandIds) {
            commandIds.forEach(commandId => {
                this.terminalService.killCommand(commandId);
            });
        }
        this.clientCommands.delete(client.id);
    }
    async handleExecuteCommand(data, client) {
        const commandId = generateUUID();
        const clientCommandIds = this.clientCommands.get(client.id) || new Set();
        clientCommandIds.add(commandId);
        this.clientCommands.set(client.id, clientCommandIds);
        this.logger.log(`Executing command: ${data.command} (ID: ${commandId})${data.projectAlias ? ` for project: ${data.projectAlias}` : ''}`);
        try {
            const options = data.projectAlias ? {
                user: data.projectAlias,
                workingDir: data.workingDir || `/home/${data.projectAlias}`
            } : undefined;
            this.terminalService.executeCommand(commandId, data.command, options);
            client.emit('commandStarted', {
                commandId,
                command: data.command,
                timestamp: new Date(),
            });
        }
        catch (error) {
            this.logger.error(`Failed to execute command: ${error.message}`);
            client.emit('commandError', {
                commandId,
                error: error.message,
                timestamp: new Date(),
            });
        }
    }
    async handleKillCommand(data, client) {
        const success = this.terminalService.killCommand(data.commandId);
        if (success) {
            const clientCommandIds = this.clientCommands.get(client.id);
            if (clientCommandIds) {
                clientCommandIds.delete(data.commandId);
            }
            client.emit('commandKilled', {
                commandId: data.commandId,
                timestamp: new Date(),
            });
            this.logger.log(`Command killed: ${data.commandId}`);
        }
        else {
            client.emit('commandError', {
                commandId: data.commandId,
                error: 'Command not found or already finished',
                timestamp: new Date(),
            });
        }
    }
    async handleGetActiveCommands(client) {
        const activeCommands = this.terminalService.getActiveCommands();
        client.emit('activeCommands', {
            commands: activeCommands,
            timestamp: new Date(),
        });
    }
};
exports.TerminalGateway = TerminalGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], TerminalGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('executeCommand'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], TerminalGateway.prototype, "handleExecuteCommand", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('killCommand'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], TerminalGateway.prototype, "handleKillCommand", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('getActiveCommands'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], TerminalGateway.prototype, "handleGetActiveCommands", null);
exports.TerminalGateway = TerminalGateway = TerminalGateway_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({
        namespace: '/terminal',
        cors: {
            origin: true,
            methods: ['GET', 'POST'],
            allowedHeaders: ['Authorization', 'Content-Type'],
            credentials: true,
        },
        transports: ['websocket', 'polling'],
        allowEIO3: true,
    }),
    __metadata("design:paramtypes", [terminal_service_1.TerminalService])
], TerminalGateway);
//# sourceMappingURL=terminal.gateway.js.map