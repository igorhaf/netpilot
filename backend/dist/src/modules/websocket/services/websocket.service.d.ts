import { Server } from 'socket.io';
export declare class WebSocketService {
    private readonly logger;
    private server;
    private userSockets;
    private socketUsers;
    setServer(server: Server): void;
    addClientConnection(userId: string, socketId: string): void;
    removeClientConnection(userId: string, socketId: string): void;
    getUserSockets(userId: string): Set<string>;
    getSocketUser(socketId: string): string | undefined;
    isUserConnected(userId: string): boolean;
    getConnectedUsers(): string[];
    emitToUser(userId: string, event: string, data: any): void;
    emitToSocket(socketId: string, event: string, data: any): void;
    emitToRoom(room: string, event: string, data: any): void;
    broadcast(event: string, data: any): void;
    joinRoom(socketId: string, room: string): void;
    leaveRoom(socketId: string, room: string): void;
    getRoomSockets(room: string): string[];
    getConnectionStats(): {
        totalConnections: number;
        totalUsers: number;
        userConnectionCounts: {
            [k: string]: number;
        };
        timestamp: Date;
    };
    disconnectUser(userId: string, reason?: string): void;
    disconnectSocket(socketId: string, reason?: string): void;
}
