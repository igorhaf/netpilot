import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);
  private server: Server;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> socketIds
  private socketUsers: Map<string, string> = new Map(); // socketId -> userId

  setServer(server: Server) {
    this.server = server;
  }

  addClientConnection(userId: string, socketId: string) {
    // Adicionar socket ao usuário
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);

    // Adicionar usuário ao socket
    this.socketUsers.set(socketId, userId);

    this.logger.debug(`Added socket ${socketId} for user ${userId}`);
  }

  removeClientConnection(userId: string, socketId: string) {
    // Remover socket do usuário
    const userSocketSet = this.userSockets.get(userId);
    if (userSocketSet) {
      userSocketSet.delete(socketId);
      if (userSocketSet.size === 0) {
        this.userSockets.delete(userId);
      }
    }

    // Remover usuário do socket
    this.socketUsers.delete(socketId);

    this.logger.debug(`Removed socket ${socketId} for user ${userId}`);
  }

  getUserSockets(userId: string): Set<string> {
    return this.userSockets.get(userId) || new Set();
  }

  getSocketUser(socketId: string): string | undefined {
    return this.socketUsers.get(socketId);
  }

  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  getConnectedUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  // ============================
  // EMIT METHODS
  // ============================

  emitToUser(userId: string, event: string, data: any) {
    const userSocketSet = this.userSockets.get(userId);
    if (userSocketSet && this.server) {
      for (const socketId of userSocketSet) {
        this.server.to(socketId).emit(event, data);
      }
      this.logger.debug(`Emitted '${event}' to user ${userId} (${userSocketSet.size} sockets)`);
    }
  }

  emitToSocket(socketId: string, event: string, data: any) {
    if (this.server) {
      this.server.to(socketId).emit(event, data);
      this.logger.debug(`Emitted '${event}' to socket ${socketId}`);
    }
  }

  emitToRoom(room: string, event: string, data: any) {
    if (this.server) {
      this.server.to(room).emit(event, data);
      this.logger.debug(`Emitted '${event}' to room ${room}`);
    }
  }

  broadcast(event: string, data: any) {
    if (this.server) {
      this.server.emit(event, data);
      this.logger.debug(`Broadcasted '${event}' to all clients`);
    }
  }

  // ============================
  // ROOM MANAGEMENT
  // ============================

  joinRoom(socketId: string, room: string) {
    if (this.server) {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket) {
        socket.join(room);
        this.logger.debug(`Socket ${socketId} joined room ${room}`);
      }
    }
  }

  leaveRoom(socketId: string, room: string) {
    if (this.server) {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket) {
        socket.leave(room);
        this.logger.debug(`Socket ${socketId} left room ${room}`);
      }
    }
  }

  getRoomSockets(room: string): string[] {
    if (this.server) {
      const roomSockets = this.server.sockets.adapter.rooms.get(room);
      return roomSockets ? Array.from(roomSockets) : [];
    }
    return [];
  }

  // ============================
  // STATISTICS
  // ============================

  getConnectionStats() {
    const totalConnections = this.socketUsers.size;
    const totalUsers = this.userSockets.size;
    const userConnectionCounts = new Map<string, number>();

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

  // ============================
  // CLEANUP METHODS
  // ============================

  disconnectUser(userId: string, reason?: string) {
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

  disconnectSocket(socketId: string, reason?: string) {
    if (this.server) {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect();
        this.logger.log(`Disconnected socket ${socketId}${reason ? ': ' + reason : ''}`);
      }
    }
  }
}