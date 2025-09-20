import { LogsService } from './logs.service';
import { LogType, LogStatus } from '../../entities/log.entity';
export declare class LogsController {
    private readonly logsService;
    constructor(logsService: LogsService);
    findAll(type?: LogType, status?: LogStatus): Promise<import("../../entities/log.entity").Log[]>;
    getStats(): Promise<{
        total: number;
        success: number;
        failed: number;
        running: number;
    }>;
    getRecent(limit?: number): Promise<import("../../entities/log.entity").Log[]>;
    clearLogs(): Promise<{
        success: boolean;
        message: string;
    }>;
    exportLogs(type?: LogType, status?: LogStatus): Promise<string>;
}
