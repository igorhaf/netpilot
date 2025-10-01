import { OnModuleInit } from '@nestjs/common';
import { Queue, Job, JobOptions } from 'bull';
import { JobQueue } from '../../entities/job-queue.entity';
import { JobExecution } from '../../entities/job-execution.entity';
import { JobQueuesGateway } from '../job-queues/job-queues.gateway';
import { Repository } from 'typeorm';
export interface JobData {
    jobQueueId: string;
    executionId: string;
    scriptPath: string;
    scriptType: string;
    environmentVars: Record<string, string>;
    timeoutSeconds: number;
    metadata?: Record<string, any>;
}
export interface JobResult {
    success: boolean;
    output?: string;
    error?: string;
    executionTimeMs: number;
    exitCode?: number;
}
export declare class RedisQueueService implements OnModuleInit {
    private jobQueue;
    private jobExecutionRepository;
    private jobQueueRepository;
    private jobQueuesGateway;
    private readonly logger;
    constructor(jobQueue: Queue, jobExecutionRepository: Repository<JobExecution>, jobQueueRepository: Repository<JobQueue>, jobQueuesGateway: JobQueuesGateway);
    onModuleInit(): Promise<void>;
    private setupQueueListeners;
    addJob(jobQueue: JobQueue, executionId: string, options?: Partial<JobOptions>): Promise<Job<JobData>>;
    handleExecuteScript(job: Job<JobData>): Promise<JobResult>;
    private executeScript;
    getQueueStats(): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
        paused: boolean;
        total: number;
    }>;
    getJob(jobId: string): Promise<Job | null>;
    removeJob(jobId: string): Promise<void>;
    retryJob(jobId: string): Promise<void>;
    pauseQueue(): Promise<void>;
    resumeQueue(): Promise<void>;
    cleanQueue(grace?: number): Promise<void>;
    getQueueHealth(): Promise<{
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
