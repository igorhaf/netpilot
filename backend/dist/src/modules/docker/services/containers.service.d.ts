import { DockerService } from './docker.service';
import { DockerEventsService } from './docker-events.service';
import { DockerMetricsService } from './docker-metrics.service';
import { User } from '../../../entities/user.entity';
import { ContainerFilters, ContainerInfo, CreateContainerConfig, ContainerAction, LogOptions, LogEntry, ContainerStats } from '../interfaces/docker.interface';
export declare class ContainersService {
    private dockerService;
    private eventsService;
    private metricsService;
    private readonly logger;
    constructor(dockerService: DockerService, eventsService: DockerEventsService, metricsService: DockerMetricsService);
    listContainers(filters?: ContainerFilters): Promise<{
        data: ContainerInfo[];
        total: number;
    }>;
    createContainer(config: CreateContainerConfig, user: User): Promise<ContainerInfo>;
    getContainer(id: string): Promise<any>;
    containerAction(id: string, action: ContainerAction, options: any, user: User): Promise<void>;
    removeContainer(id: string, force: boolean, user: User): Promise<void>;
    getContainerLogs(id: string, options: LogOptions): Promise<LogEntry[]>;
    getContainerStats(id: string): Promise<ContainerStats>;
    createExecSession(id: string, command: string[], options: any, user: User): Promise<any>;
}
