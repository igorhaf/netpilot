import { Repository } from 'typeorm';
import { JobQueue } from '../../entities/job-queue.entity';
import { JobExecution } from '../../entities/job-execution.entity';
import { JobSchedule } from '../../entities/job-schedule.entity';
import { CreateJobQueueDto } from './dto/create-job-queue.dto';
import { UpdateJobQueueDto } from './dto/update-job-queue.dto';
import { CronValidationResult, JobStatistics } from './types/job-queue.types';
export declare class JobQueuesService {
    private jobQueueRepository;
    private jobExecutionRepository;
    private jobScheduleRepository;
    constructor(jobQueueRepository: Repository<JobQueue>, jobExecutionRepository: Repository<JobExecution>, jobScheduleRepository: Repository<JobSchedule>);
    create(createJobQueueDto: CreateJobQueueDto, userId?: string): Promise<JobQueue>;
    findAll(search?: string, isActive?: boolean): Promise<JobQueue[]>;
    findOne(id: string): Promise<JobQueue>;
    update(id: string, updateJobQueueDto: UpdateJobQueueDto): Promise<JobQueue>;
    remove(id: string): Promise<void>;
    toggleActive(id: string): Promise<JobQueue>;
    validateCronExpression(cronExpression: string): CronValidationResult;
    getStatistics(): Promise<JobStatistics>;
    getUpcomingExecutions(limit?: number): Promise<any[]>;
}
