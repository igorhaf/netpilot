import { Repository } from 'typeorm';
import { Queue, Job } from 'bull';
import { DockerJob, JobType, JobStatus } from '../entities/docker-job.entity';
import { User } from '../../../entities/user.entity';
export declare class JobsService {
    private jobsRepo;
    private dockerQueue;
    private readonly logger;
    constructor(jobsRepo: Repository<DockerJob>, dockerQueue: Queue);
    createJob(type: JobType, resourceType: string, resourceId: string, parameters: any, user: User): Promise<DockerJob>;
    getJob(jobId: string): Promise<DockerJob>;
    getJobs(filters?: {
        user_id?: string;
        type?: JobType;
        status?: JobStatus;
        limit?: number;
        offset?: number;
    }): Promise<{
        jobs: DockerJob[];
        total: number;
    }>;
    updateJobProgress(jobId: string, progress: number, message?: string): Promise<void>;
    completeJob(jobId: string, result: any): Promise<void>;
    failJob(jobId: string, error: string): Promise<void>;
    processVolumeBackup(job: Job<any>): Promise<void>;
    processVolumeRestore(job: Job<any>): Promise<void>;
    processImagePull(job: Job<any>): Promise<void>;
    processPrune(job: Job<any>): Promise<void>;
    private simulateBackup;
    private simulateRestore;
    private simulatePull;
    private simulatePrune;
}
