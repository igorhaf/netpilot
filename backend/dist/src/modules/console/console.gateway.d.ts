import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConsoleService } from './console.service';
import { ExecuteCommandDto } from '../../dtos/ssh-session.dto';
interface AuthenticatedSocket extends Socket {
    userId?: string;
    user?: any;
}
export declare class ConsoleGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly consoleService;
    private readonly jwtService;
    server: Server;
    private readonly logger;
    private userSockets;
    constructor(consoleService: ConsoleService, jwtService: JwtService);
    afterInit(server: Server): void;
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): void;
    handleSessionConnect(client: AuthenticatedSocket, data: {
        sessionId: string;
    }): Promise<void>;
    handleSessionDisconnect(client: AuthenticatedSocket, data: {
        sessionId: string;
    }): Promise<void>;
    handleCommandExecute(client: AuthenticatedSocket, data: ExecuteCommandDto & {
        requestId?: string;
    }): Promise<void>;
    handleJoinSession(client: AuthenticatedSocket, data: {
        sessionId: string;
    }): Promise<void>;
    handleLeaveSession(client: AuthenticatedSocket, data: {
        sessionId: string;
    }): void;
    handleTerminalResize(client: AuthenticatedSocket, data: {
        sessionId: string;
        cols: number;
        rows: number;
    }): void;
    handlePing(client: AuthenticatedSocket): void;
    private validateTokenAndGetUserId;
    private broadcastToUser;
    emitToSession(sessionId: string, event: string, data: any): void;
    emitToUser(userId: string, event: string, data: any): void;
}
export {};
