import { JobQueuesService } from './job-queues.service';
import { JobExecutionsService } from './job-executions.service';
import { JobSchedulerService } from './job-scheduler.service';
import { CreateJobQueueDto } from './dto/create-job-queue.dto';
import { UpdateJobQueueDto } from './dto/update-job-queue.dto';
import { ExecuteJobDto } from './dto/execute-job.dto';
import { JobExecutionQueryDto } from './dto/job-execution-query.dto';
export declare class JobQueuesController {
    private readonly jobQueuesService;
    private readonly jobExecutionsService;
    private readonly jobSchedulerService;
    constructor(jobQueuesService: JobQueuesService, jobExecutionsService: JobExecutionsService, jobSchedulerService: JobSchedulerService);
    create(createJobQueueDto: CreateJobQueueDto, req: any): Promise<import("../../entities/job-queue.entity").JobQueue>;
    findAll(search?: string, isActive?: string): Promise<import("../../entities/job-queue.entity").JobQueue[]>;
    getStatistics(): Promise<import("./types/job-queue.types").JobStatistics>;
    getUpcomingExecutions(limit?: string): Promise<any[]>;
    findOne(id: string): Promise<import("../../entities/job-queue.entity").JobQueue>;
    update(id: string, updateJobQueueDto: UpdateJobQueueDto): Promise<import("../../entities/job-queue.entity").JobQueue>;
    remove(id: string): Promise<void>;
    executeJob(id: string, executeJobDto: ExecuteJobDto, req: any): Promise<import("../../entities/job-execution.entity").JobExecution>;
    toggleActive(id: string): Promise<import("../../entities/job-queue.entity").JobQueue>;
    validateCron(id: string, cronExpression: string): import("./types/job-queue.types").CronValidationResult;
}
export declare class JobExecutionsController {
    private readonly jobExecutionsService;
    constructor(jobExecutionsService: JobExecutionsService);
    findAll(queryDto: JobExecutionQueryDto): Promise<{
        data: import("../../entities/job-execution.entity").JobExecution[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<import("../../entities/job-execution.entity").JobExecution>;
    cancel(id: string): Promise<import("../../entities/job-execution.entity").JobExecution>;
    retry(id: string): Promise<import("../../entities/job-execution.entity").JobExecution>;
    getLogs(id: string): Promise<{
        outputLog: string;
        errorLog: string;
    }>;
    getRedisStats(): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
        paused: boolean;
        total: number;
    } | {
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
        paused: boolean;
        total: number;
        error: string;
    }>;
    getRedisHealth(): Promise<{
        healthy: boolean;
        paused: boolean;
        stats: {
            waiting: number;
            active: number;
            completed: number;
            failed: number;
            delayed: number;
            paused: boolean;
            total: number;
        };
        timestamp: Date;
        error?: undefined;
    } | {
        healthy: boolean;
        error: any;
        timestamp: Date;
        paused?: undefined;
        stats?: undefined;
    }>;
}
export declare class JobSchedulesController {
    private readonly jobSchedulerService;
    constructor(jobSchedulerService: JobSchedulerService);
    getActiveSchedules(): Promise<import("../../entities/job-schedule.entity").JobSchedule[]>;
    createSchedule(jobQueueId: string, scheduleData: any): Promise<import("../../entities/job-schedule.entity").JobSchedule>;
    pauseSchedule(id: string): Promise<import("../../entities/job-schedule.entity").JobSchedule>;
    resumeSchedule(id: string): Promise<import("../../entities/job-schedule.entity").JobSchedule>;
    deleteSchedule(id: string): Promise<void>;
}
