import { User } from './user.entity';
import { JobExecution } from './job-execution.entity';
import { JobSchedule } from './job-schedule.entity';
export declare enum ScriptType {
    SHELL = "shell",
    NODE = "node",
    PYTHON = "python",
    INTERNAL = "internal"
}
export declare class JobQueue {
    id: string;
    name: string;
    description: string;
    scriptPath: string;
    scriptType: ScriptType;
    cronExpression: string;
    isActive: boolean;
    priority: number;
    maxRetries: number;
    timeoutSeconds: number;
    environmentVars: Record<string, string>;
    metadata: Record<string, any>;
    createdBy: User;
    executions: JobExecution[];
    schedules: JobSchedule[];
    createdAt: Date;
    updatedAt: Date;
}
