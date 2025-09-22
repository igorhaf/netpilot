import { ScriptType } from '../../../entities/job-queue.entity';
export declare class CreateJobQueueDto {
    name: string;
    description?: string;
    scriptPath: string;
    scriptType: ScriptType;
    cronExpression?: string;
    isActive?: boolean;
    priority?: number;
    maxRetries?: number;
    timeoutSeconds?: number;
    environmentVars?: Record<string, string>;
    metadata?: Record<string, any>;
}
