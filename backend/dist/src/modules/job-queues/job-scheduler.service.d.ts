import { Repository } from 'typeorm';
import { JobQueue } from '../../entities/job-queue.entity';
import { JobExecution } from '../../entities/job-execution.entity';
import { JobSchedule } from '../../entities/job-schedule.entity';
import { JobExecutionsService } from './job-executions.service';
export declare class JobSchedulerService {
    private jobQueueRepository;
    private jobExecutionRepository;
    private jobScheduleRepository;
    private jobExecutionsService;
    private readonly logger;
    constructor(jobQueueRepository: Repository<JobQueue>, jobExecutionRepository: Repository<JobExecution>, jobScheduleRepository: Repository<JobSchedule>, jobExecutionsService: JobExecutionsService);
    processScheduledJobs(): Promise<void>;
    private checkAndExecuteJob;
    private shouldExecuteNow;
    private processJobSchedules;
    private executeScheduledJob;
    private updateNextExecution;
    createSchedule(jobQueueId: string, scheduleData: Partial<JobSchedule>): Promise<JobSchedule>;
    private calculateInitialExecution;
    getActiveSchedules(): Promise<JobSchedule[]>;
    pauseSchedule(scheduleId: string): Promise<JobSchedule>;
    resumeSchedule(scheduleId: string): Promise<JobSchedule>;
    deleteSchedule(scheduleId: string): Promise<void>;
}
