import { Repository } from 'typeorm';
import { JobExecution } from '../../entities/job-execution.entity';
import { JobQueue } from '../../entities/job-queue.entity';
import { JobExecutionQueryDto } from './dto/job-execution-query.dto';
import { ExecuteJobDto } from './dto/execute-job.dto';
export declare class JobExecutionsService {
    private jobExecutionRepository;
    private jobQueueRepository;
    private runningProcesses;
    constructor(jobExecutionRepository: Repository<JobExecution>, jobQueueRepository: Repository<JobQueue>);
    executeJob(jobQueueId: string, executeJobDto: ExecuteJobDto, userId?: string): Promise<JobExecution>;
    private performExecution;
    private executeScript;
    private executeInternalScript;
    findAll(queryDto: JobExecutionQueryDto): Promise<{
        data: JobExecution[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<JobExecution>;
    cancel(id: string): Promise<JobExecution>;
    retry(id: string): Promise<JobExecution>;
}
