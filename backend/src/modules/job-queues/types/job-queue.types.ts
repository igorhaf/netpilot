export interface JobExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTimeMs: number;
  metadata?: Record<string, any>;
}

export interface ScriptExecutionContext {
  jobQueue: any;
  execution: any;
  environmentVars?: Record<string, string>;
  metadata?: Record<string, any>;
  timeout: number;
}

export interface CronValidationResult {
  isValid: boolean;
  error?: string;
  nextExecutions?: Date[];
}

export interface JobStatistics {
  totalJobs: number;
  activeJobs: number;
  completedExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  upcomingExecutions: number;
}