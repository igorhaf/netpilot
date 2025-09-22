export declare class DockerMetricsService {
    private readonly containerActionsTotal;
    private readonly containerActionDuration;
    private readonly activeContainers;
    private readonly volumeUsage;
    private readonly jobsActive;
    private readonly apiRequestsTotal;
    recordContainerAction(action: string, status: 'success' | 'error', userId: string, duration?: number): void;
    updateContainerStats(containers: any[]): void;
    updateVolumeUsage(volumes: any[]): void;
    updateJobsStats(jobs: any[]): void;
    recordApiRequest(method: string, endpoint: string, statusCode: number): void;
}
