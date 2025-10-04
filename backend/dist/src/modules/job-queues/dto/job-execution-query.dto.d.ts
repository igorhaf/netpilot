import { TriggerType } from '../../../entities/job-execution.entity';
export declare class JobExecutionQueryDto {
    jobQueueId?: string;
    status?: string;
    triggerType?: TriggerType;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    search?: string;
    projectId?: string;
}
