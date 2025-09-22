import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { WebSocketService } from './services/websocket.service';
import { SshWebSocketHandler } from './handlers/ssh-websocket.handler';
import { DockerWebSocketHandler } from './handlers/docker-websocket.handler';
interface AuthenticatedSocket extends Socket {
    userId?: string;
    user?: any;
}
export declare class WebSocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    private readonly webSocketService;
    private readonly sshHandler;
    private readonly dockerHandler;
    server: Server;
    private readonly logger;
    constructor(jwtService: JwtService, webSocketService: WebSocketService, sshHandler: SshWebSocketHandler, dockerHandler: DockerWebSocketHandler);
    afterInit(server: Server): void;
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): void;
    handleSshConnect(client: AuthenticatedSocket, data: {
        sessionId: string;
    }): Promise<void>;
    handleSshDisconnect(client: AuthenticatedSocket, data: {
        sessionId: string;
    }): Promise<void>;
    handleSshCommand(client: AuthenticatedSocket, data: {
        sessionId: string;
        command: string;
        requestId?: string;
    }): Promise<void>;
    handleSshResize(client: AuthenticatedSocket, data: {
        sessionId: string;
        cols: number;
        rows: number;
    }): void;
    handleSshJoin(client: AuthenticatedSocket, data: {
        sessionId: string;
    }): Promise<void>;
    handleSshLeave(client: AuthenticatedSocket, data: {
        sessionId: string;
    }): void;
    handleDockerLogsStart(client: AuthenticatedSocket, data: {
        containerId: string;
        tail?: number;
        follow?: boolean;
    }): Promise<void>;
    handleDockerLogsStop(client: AuthenticatedSocket, data: {
        containerId: string;
    }): Promise<void>;
    handleDockerStatsStart(client: AuthenticatedSocket, data: {
        containerId: string;
    }): Promise<void>;
    handleDockerStatsStop(client: AuthenticatedSocket, data: {
        containerId: string;
    }): Promise<void>;
    handleDockerExecStart(client: AuthenticatedSocket, data: {
        containerId: string;
        command: string[];
        interactive?: boolean;
        tty?: boolean;
        env?: string[];
    }): Promise<void>;
    handleDockerExecInput(client: AuthenticatedSocket, data: {
        execId: string;
        input: string;
    }): Promise<void>;
    handleDockerExecResize(client: AuthenticatedSocket, data: {
        execId: string;
        cols: number;
        rows: number;
    }): Promise<void>;
    handleDockerExecStop(client: AuthenticatedSocket, data: {
        execId: string;
    }): Promise<void>;
    handlePing(client: AuthenticatedSocket): void;
    handleJoinRoom(client: AuthenticatedSocket, data: {
        room: string;
    }): void;
    handleLeaveRoom(client: AuthenticatedSocket, data: {
        room: string;
    }): void;
    private extractToken;
    private validateTokenAndGetUserId;
}
export {};
