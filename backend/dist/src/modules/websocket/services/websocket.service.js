"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var WebSocketService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketService = void 0;
const common_1 = require("@nestjs/common");
let WebSocketService = WebSocketService_1 = class WebSocketService {
    constructor() {
        this.logger = new common_1.Logger(WebSocketService_1.name);
        this.userSockets = new Map();
        this.socketUsers = new Map();
    }
    setServer(server) {
        this.server = server;
    }
    addClientConnection(userId, socketId) {
        if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId).add(socketId);
        this.socketUsers.set(socketId, userId);
        this.logger.debug(`Added socket ${socketId} for user ${userId}`);
    }
    removeClientConnection(userId, socketId) {
        const userSocketSet = this.userSockets.get(userId);
        if (userSocketSet) {
            userSocketSet.delete(socketId);
            if (userSocketSet.size === 0) {
                this.userSockets.delete(userId);
            }
        }
        this.socketUsers.delete(socketId);
        this.logger.debug(`Removed socket ${socketId} for user ${userId}`);
    }
    getUserSockets(userId) {
        return this.userSockets.get(userId) || new Set();
    }
    getSocketUser(socketId) {
        return this.socketUsers.get(socketId);
    }
    isUserConnected(userId) {
        return this.userSockets.has(userId) && this.userSockets.get(userId).size > 0;
    }
    getConnectedUsers() {
        return Array.from(this.userSockets.keys());
    }
    emitToUser(userId, event, data) {
        const userSocketSet = this.userSockets.get(userId);
        if (userSocketSet && this.server) {
            for (const socketId of userSocketSet) {
                this.server.to(socketId).emit(event, data);
            }
            this.logger.debug(`Emitted '${event}' to user ${userId} (${userSocketSet.size} sockets)`);
        }
    }
    emitToSocket(socketId, event, data) {
        if (this.server) {
            this.server.to(socketId).emit(event, data);
            this.logger.debug(`Emitted '${event}' to socket ${socketId}`);
        }
    }
    emitToRoom(room, event, data) {
        if (this.server) {
            this.server.to(room).emit(event, data);
            this.logger.debug(`Emitted '${event}' to room ${room}`);
        }
    }
    broadcast(event, data) {
        if (this.server) {
            this.server.emit(event, data);
            this.logger.debug(`Broadcasted '${event}' to all clients`);
        }
    }
    joinRoom(socketId, room) {
        if (this.server) {
            const socket = this.server.sockets.sockets.get(socketId);
            if (socket) {
                socket.join(room);
                this.logger.debug(`Socket ${socketId} joined room ${room}`);
            }
        }
    }
    leaveRoom(socketId, room) {
        if (this.server) {
            const socket = this.server.sockets.sockets.get(socketId);
            if (socket) {
                socket.leave(room);
                this.logger.debug(`Socket ${socketId} left room ${room}`);
            }
        }
    }
    getRoomSockets(room) {
        if (this.server) {
            const roomSockets = this.server.sockets.adapter.rooms.get(room);
            return roomSockets ? Array.from(roomSockets) : [];
        }
        return [];
    }
    getConnectionStats() {
        const totalConnections = this.socketUsers.size;
        const totalUsers = this.userSockets.size;
        const userConnectionCounts = new Map();
        for (const [userId, sockets] of this.userSockets) {
            userConnectionCounts.set(userId, sockets.size);
        }
        return {
            totalConnections,
            totalUsers,
            userConnectionCounts: Object.fromEntries(userConnectionCounts),
            timestamp: new Date()
        };
    }
    disconnectUser(userId, reason) {
        const userSockets = this.getUserSockets(userId);
        if (this.server && userSockets.size > 0) {
            for (const socketId of userSockets) {
                const socket = this.server.sockets.sockets.get(socketId);
                if (socket) {
                    socket.disconnect();
                }
            }
            this.logger.log(`Disconnected user ${userId} (${userSockets.size} sockets)${reason ? ': ' + reason : ''}`);
        }
    }
    disconnectSocket(socketId, reason) {
        if (this.server) {
            const socket = this.server.sockets.sockets.get(socketId);
            if (socket) {
                socket.disconnect();
                this.logger.log(`Disconnected socket ${socketId}${reason ? ': ' + reason : ''}`);
            }
        }
    }
};
exports.WebSocketService = WebSocketService;
exports.WebSocketService = WebSocketService = WebSocketService_1 = __decorate([
    (0, common_1.Injectable)()
], WebSocketService);
//# sourceMappingURL=websocket.service.js.map