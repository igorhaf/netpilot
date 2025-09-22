import { JobQueue } from './job-queue.entity';
export declare enum ScheduleType {
    CRON = "cron",
    INTERVAL = "interval",
    SPECIFIC_DATES = "specific_dates",
    ONCE = "once"
}
export declare class JobSchedule {
    id: string;
    jobQueue: JobQueue;
    scheduleType: ScheduleType;
    cronExpression: string;
    intervalMinutes: number;
    specificDates: Date[];
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    nextExecution: Date;
    lastExecution: Date;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
