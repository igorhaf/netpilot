import { ScriptExecutionContext, JobExecutionResult } from '../types/job-queue.types';
import { Repository } from 'typeorm';
import { Log } from '../../../entities/log.entity';
export declare class AIAnalysisScript {
    private logRepository;
    constructor(logRepository: Repository<Log>);
    execute(context: ScriptExecutionContext): Promise<JobExecutionResult>;
    private performAIAnalysis;
    private analyzeSecurityThreats;
    private analyzePerformanceIssues;
    private analyzeErrors;
    private analyzeOptimizations;
    private extractErrorType;
    private generateRecommendations;
    private generateReport;
    private saveDetailedReport;
}
export default function (context: ScriptExecutionContext): Promise<JobExecutionResult>;
