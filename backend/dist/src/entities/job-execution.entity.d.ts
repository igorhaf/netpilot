import { JobQueue } from './job-queue.entity';
import { User } from './user.entity';
export declare enum ExecutionStatus {
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled",
    TIMEOUT = "timeout"
}
export declare enum TriggerType {
    SCHEDULED = "scheduled",
    MANUAL = "manual",
    API = "api"
}
export declare class JobExecution {
    id: string;
    jobQueue: JobQueue;
    status: ExecutionStatus;
    startedAt: Date;
    completedAt: Date;
    executionTimeMs: number;
    outputLog: string;
    errorLog: string;
    retryCount: number;
    triggerType: TriggerType;
    triggeredBy: User;
    metadata: Record<string, any>;
    pid: number;
    createdAt: Date;
}
