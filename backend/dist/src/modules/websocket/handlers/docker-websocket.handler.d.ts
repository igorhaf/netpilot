import { Server, Socket } from 'socket.io';
import { DockerService } from '../../docker/services/docker.service';
import { ContainersService } from '../../docker/services/containers.service';
interface AuthenticatedSocket extends Socket {
    userId?: string;
}
export declare class DockerWebSocketHandler {
    private readonly dockerService;
    private readonly containersService;
    private readonly logger;
    private server;
    private activeLogStreams;
    private activeStatsStreams;
    private activeExecSessions;
    constructor(dockerService: DockerService, containersService: ContainersService);
    setServer(server: Server): void;
    handleLogsStart(client: AuthenticatedSocket, data: {
        containerId: string;
        tail?: number;
        follow?: boolean;
    }): Promise<void>;
    handleLogsStop(client: AuthenticatedSocket, data: {
        containerId: string;
    }): Promise<void>;
    handleStatsStart(client: AuthenticatedSocket, data: {
        containerId: string;
    }): Promise<void>;
    handleStatsStop(client: AuthenticatedSocket, data: {
        containerId: string;
    }): Promise<void>;
    handleExecStart(client: AuthenticatedSocket, data: {
        containerId: string;
        command: string[];
        interactive?: boolean;
        tty?: boolean;
        env?: string[];
    }): Promise<void>;
    handleExecInput(client: AuthenticatedSocket, data: {
        execId: string;
        input: string;
    }): Promise<void>;
    handleExecResize(client: AuthenticatedSocket, data: {
        execId: string;
        cols: number;
        rows: number;
    }): Promise<void>;
    handleExecStop(client: AuthenticatedSocket, data: {
        execId: string;
    }): Promise<void>;
    private calculateCpuUsage;
    private calculateMemoryUsage;
    private calculateNetworkIO;
    private calculateBlockIO;
    private cleanupInactiveStreams;
    getActiveStreams(): {
        logs: number;
        stats: number;
        exec: number;
    };
    emitToContainer(containerId: string, event: string, data: any): void;
}
export {};
