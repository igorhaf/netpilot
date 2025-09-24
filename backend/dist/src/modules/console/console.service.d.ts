import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SshSession } from '../../entities/ssh-session.entity';
import { ConsoleLog } from '../../entities/console-log.entity';
import { CreateSshSessionDto, UpdateSshSessionDto, ExecuteCommandDto } from '../../dtos/ssh-session.dto';
export declare class ConsoleService implements OnModuleInit {
    private readonly sshSessionRepository;
    private readonly consoleLogRepository;
    private activeConnections;
    private readonly connectionTimeout;
    constructor(sshSessionRepository: Repository<SshSession>, consoleLogRepository: Repository<ConsoleLog>);
    onModuleInit(): Promise<void>;
    private ensureDefaultSshSession;
    createSession(userId: string, createDto: CreateSshSessionDto): Promise<SshSession>;
    findUserSessions(userId: string): Promise<SshSession[]>;
    findSessionById(userId: string, sessionId: string): Promise<SshSession>;
    updateSession(userId: string, sessionId: string, updateDto: UpdateSshSessionDto): Promise<SshSession>;
    deleteSession(userId: string, sessionId: string): Promise<void>;
    connectToSession(userId: string, sessionId: string): Promise<boolean>;
    disconnectSession(userId: string, sessionId: string): Promise<void>;
    executeCommand(userId: string, executeDto: ExecuteCommandDto): Promise<ConsoleLog>;
    getCommandLogs(userId: string, sessionId: string, page?: number, limit?: number): Promise<{
        logs: ConsoleLog[];
        total: number;
    }>;
    isSessionConnected(userId: string, sessionId: string): boolean;
    getUserSessionStats(userId: string): Promise<{
        totalSessions: number;
        activeSessions: number;
        connectedSessions: number;
        totalCommands: number;
    }>;
    private cleanupInactiveConnections;
    private encrypt;
    private decrypt;
}
