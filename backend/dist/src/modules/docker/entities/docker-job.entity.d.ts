import { User } from '../../../entities/user.entity';
export type JobType = 'backup' | 'restore' | 'pull' | 'prune' | 'exec';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';
export declare class DockerJob {
    id: string;
    type: JobType;
    status: JobStatus;
    resource_type: string;
    resource_id: string;
    parameters: any;
    progress: number;
    message: string;
    result: any;
    error: string;
    user: User;
    created_at: Date;
    updated_at: Date;
    completed_at: Date;
}
