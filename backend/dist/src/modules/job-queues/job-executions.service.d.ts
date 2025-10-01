import { Repository } from 'typeorm';
import { JobExecution } from '../../entities/job-execution.entity';
import { JobQueue } from '../../entities/job-queue.entity';
import { JobExecutionQueryDto } from './dto/job-execution-query.dto';
import { ExecuteJobDto } from './dto/execute-job.dto';
import { JobQueuesGateway } from './job-queues.gateway';
import { RedisQueueService } from '../redis/redis-queue.service';
export declare class JobExecutionsService {
    private jobExecutionRepository;
    private jobQueueRepository;
    private jobQueuesGateway;
    private redisQueueService;
    private runningProcesses;
    constructor(jobExecutionRepository: Repository<JobExecution>, jobQueueRepository: Repository<JobQueue>, jobQueuesGateway: JobQueuesGateway, redisQueueService: RedisQueueService);
    executeJob(jobQueueId: string, executeJobDto: ExecuteJobDto, userId?: string): Promise<JobExecution>;
    getRedisStats(): Promise<{
        healthy: boolean;
        stats: any;
        python_integration: boolean;
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
        python_service: boolean;
    } | {
        healthy: boolean;
        error: any;
        timestamp: Date;
    }>;
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
