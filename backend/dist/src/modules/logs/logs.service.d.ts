import { Repository } from 'typeorm';
import { Log, LogType, LogStatus } from '../../entities/log.entity';
export declare class LogsService {
    private logRepository;
    constructor(logRepository: Repository<Log>);
    findAll(type?: LogType, status?: LogStatus, search?: string, page?: number, limit?: number): Promise<{
        logs: Log[];
        total: number;
    }>;
    getStats(): Promise<{
        total: number;
        success: number;
        failed: number;
        running: number;
    }>;
    createLog(type: LogType, action: string, message?: string, details?: string): Promise<Log>;
    updateLogStatus(id: string, status: LogStatus, message?: string, details?: string): Promise<void>;
    clearLogs(): Promise<{
        success: boolean;
        message: string;
    }>;
    getRecentLogs(limit?: number): Promise<Log[]>;
    findById(id: string): Promise<Log>;
    exportLogs(type?: LogType, status?: LogStatus): Promise<string>;
}
