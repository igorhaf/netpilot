import { TriggerType } from '../../../entities/job-execution.entity';
export declare class ExecuteJobDto {
    triggerType?: TriggerType;
    metadata?: Record<string, any>;
    environmentVars?: Record<string, string>;
    delay?: number;
    priority?: number;
}
