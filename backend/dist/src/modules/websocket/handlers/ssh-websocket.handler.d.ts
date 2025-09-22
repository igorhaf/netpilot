import { Server, Socket } from 'socket.io';
import { Client } from 'ssh2';
import { Repository } from 'typeorm';
import { SshSession } from '../../../entities/ssh-session.entity';
import { ConsoleLog } from '../../../entities/console-log.entity';
import { ConsoleService } from '../../console/console.service';
interface AuthenticatedSocket extends Socket {
    userId?: string;
}
interface ActiveSshConnection {
    client: Client;
    sessionId: string;
    userId: string;
    stream?: any;
    connectedAt: Date;
    lastActivity: Date;
}
export declare class SshWebSocketHandler {
    private readonly sshSessionRepository;
    private readonly consoleLogRepository;
    private readonly consoleService;
    private readonly logger;
    private server;
    private activeConnections;
    constructor(sshSessionRepository: Repository<SshSession>, consoleLogRepository: Repository<ConsoleLog>, consoleService: ConsoleService);
    setServer(server: Server): void;
    handleConnect(client: AuthenticatedSocket, data: {
        sessionId: string;
    }): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket, data: {
        sessionId: string;
    }): Promise<void>;
    handleCommand(client: AuthenticatedSocket, data: {
        sessionId: string;
        command: string;
        requestId?: string;
    }): Promise<void>;
    handleResize(client: AuthenticatedSocket, data: {
        sessionId: string;
        cols: number;
        rows: number;
    }): void;
    handleJoin(client: AuthenticatedSocket, data: {
        sessionId: string;
    }): Promise<void>;
    handleLeave(client: AuthenticatedSocket, data: {
        sessionId: string;
    }): void;
    private cleanupInactiveConnections;
    getActiveConnections(): Map<string, ActiveSshConnection>;
    emitToSession(sessionId: string, event: string, data: any): void;
}
export {};
