import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { SshSession } from '../../entities/ssh-session.entity';
import { ConsoleLog } from '../../entities/console-log.entity';
import { CreateSshSessionDto, UpdateSshSessionDto, ExecuteCommandDto } from '../../dtos/ssh-session.dto';
export declare class ConsoleService implements OnModuleInit {
    private readonly sshSessionRepository;
    private readonly consoleLogRepository;
    private readonly httpService;
    private readonly configService;
    private readonly systemOpsUrl;
    private readonly systemOpsToken;
    constructor(sshSessionRepository: Repository<SshSession>, consoleLogRepository: Repository<ConsoleLog>, httpService: HttpService, configService: ConfigService);
    onModuleInit(): Promise<void>;
    connectToSession(userId: string, sessionId: string): Promise<{
        success: boolean;
        message: string;
        connectionId?: string;
    }>;
    executeCommand(userId: string, executeDto: ExecuteCommandDto): Promise<ConsoleLog>;
    disconnectFromSession(userId: string, sessionId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getActiveSSHSessions(): Promise<any[]>;
    createSession(userId: string, createSshSessionDto: CreateSshSessionDto): Promise<SshSession>;
    findUserSessions(userId: string): Promise<SshSession[]>;
    findSessionById(userId: string, id: string): Promise<SshSession>;
    updateSession(userId: string, id: string, updateSshSessionDto: UpdateSshSessionDto): Promise<SshSession>;
    deleteSession(userId: string, id: string): Promise<void>;
    disconnectSession(userId: string, sessionId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getCommandLogs(userId: string, sessionId: string, page?: number, limit?: number): Promise<{
        logs: ConsoleLog[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getUserSessionStats(userId: string): Promise<any>;
    isSessionConnected(userId: string, sessionId: string): boolean;
    create(createSshSessionDto: CreateSshSessionDto, userId: string): Promise<SshSession>;
    findAll(userId: string): Promise<SshSession[]>;
    findOne(id: string, userId: string): Promise<SshSession>;
    update(id: string, updateSshSessionDto: UpdateSshSessionDto, userId: string): Promise<SshSession>;
    remove(id: string, userId: string): Promise<void>;
    getCommandHistory(sessionId: string, userId: string, page?: number, limit?: number): Promise<{
        logs: ConsoleLog[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    private checkSystemOpsHealth;
    private ensureDefaultSshSession;
    private encrypt;
    private decrypt;
}
