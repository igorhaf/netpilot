import { ScriptExecutionContext, JobExecutionResult } from '../types/job-queue.types';
export declare function execute(context: ScriptExecutionContext): Promise<JobExecutionResult>;
export default execute;
