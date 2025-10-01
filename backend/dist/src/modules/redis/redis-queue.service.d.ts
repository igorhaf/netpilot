import { OnModuleInit } from '@nestjs/common';
import { Queue, Job, JobOptions } from 'bull';
import { JobQueue } from '../../entities/job-queue.entity';
import { JobExecution } from '../../entities/job-execution.entity';
import { JobQueuesGateway } from '../job-queues/job-queues.gateway';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
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
    private httpService;
    private configService;
    private readonly logger;
    private readonly systemOpsUrl;
    constructor(jobQueue: Queue, jobExecutionRepository: Repository<JobExecution>, jobQueueRepository: Repository<JobQueue>, jobQueuesGateway: JobQueuesGateway, httpService: HttpService, configService: ConfigService);
    onModuleInit(): Promise<void>;
    private setupQueueListeners;
    addJob(jobQueue: JobQueue, executionId: string, metadata?: Record<string, any>, options?: JobOptions): Promise<Job>;
    processJob(job: Job<JobData>): Promise<JobResult>;
    private executeScriptViaPython;
    private getSystemOpsToken;
    private executeScriptDirectly;
    checkSystemOpsHealth(): Promise<boolean>;
    getSystemOpsStats(): Promise<any>;
    getQueueStats(): Promise<{
        healthy: boolean;
        stats: any;
        python_integration: boolean;
    }>;
    getQueueHealth(): Promise<{
        healthy: boolean;
        python_service: boolean;
    }>;
}
