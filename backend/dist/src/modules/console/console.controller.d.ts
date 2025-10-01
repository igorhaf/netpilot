import { ConsoleService } from './console.service';
import { CreateSshSessionDto, UpdateSshSessionDto, ExecuteCommandDto } from '../../dtos/ssh-session.dto';
export declare class ConsoleController {
    private readonly consoleService;
    constructor(consoleService: ConsoleService);
    createSession(req: any, createSshSessionDto: CreateSshSessionDto): Promise<import("../../entities/ssh-session.entity").SshSession>;
    findAllSessions(req: any): Promise<import("../../entities/ssh-session.entity").SshSession[]>;
    getSessionStats(req: any): Promise<any>;
    findSession(req: any, id: string): Promise<import("../../entities/ssh-session.entity").SshSession>;
    updateSession(req: any, id: string, updateSshSessionDto: UpdateSshSessionDto): Promise<import("../../entities/ssh-session.entity").SshSession>;
    removeSession(req: any, id: string): Promise<{
        message: string;
    }>;
    connectSession(req: any, sessionId: string): Promise<{
        sessionId: string;
        connected: {
            success: boolean;
            message: string;
            connectionId?: string;
        };
        message: string;
    }>;
    disconnectSession(req: any, sessionId: string): Promise<{
        sessionId: string;
        message: string;
    }>;
    getSessionStatus(req: any, sessionId: string): Promise<{
        sessionId: string;
        connected: boolean;
        status: string;
    }>;
    executeCommand(req: any, executeCommandDto: ExecuteCommandDto): Promise<import("../../entities/console-log.entity").ConsoleLog>;
    getCommandLogs(req: any, sessionId: string, page: number, limit: number): Promise<{
        logs: import("../../entities/console-log.entity").ConsoleLog[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getAllCommandLogs(req: any, page: number, limit: number, sessionId?: string): Promise<{
        logs: import("../../entities/console-log.entity").ConsoleLog[];
        total: number;
        page: number;
        totalPages: number;
    } | {
        logs: any[];
        total: number;
    }>;
}
