import { JobsService } from '../services/jobs.service';
export declare class JobsController {
    private jobsService;
    constructor(jobsService: JobsService);
    getJobs(req: any, type?: string, status?: string, limit?: number, offset?: number): Promise<{
        jobs: import("../entities/docker-job.entity").DockerJob[];
        total: number;
    }>;
    getJob(id: string): Promise<import("../entities/docker-job.entity").DockerJob>;
}
