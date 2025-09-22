import * as Docker from 'dockerode';
import { IDockerService, ContainerFilters, ContainerInfo, ContainerInspectInfo, CreateContainerConfig, ContainerAction, LogOptions, LogEntry, VolumeFilters, VolumeInfo, CreateVolumeConfig, NetworkFilters, NetworkInfo, CreateNetworkConfig, ImageFilters, ImageInfo, ContainerStats } from '../interfaces/docker.interface';
export declare class DockerService implements IDockerService {
    private config;
    private docker;
    private readonly logger;
    constructor(config: {
        socketPath?: string;
        host?: string;
        port?: number;
    });
    listContainers(filters?: ContainerFilters): Promise<ContainerInfo[]>;
    createContainer(config: CreateContainerConfig): Promise<string>;
    getContainer(id: string): Promise<ContainerInspectInfo>;
    getDockerContainer(id: string): Docker.Container;
    containerAction(id: string, action: ContainerAction, options?: any): Promise<void>;
    removeContainer(id: string, force?: boolean): Promise<void>;
    getContainerLogs(id: string, options: LogOptions): Promise<LogEntry[]>;
    getContainerStats(id: string): Promise<ContainerStats>;
    private calculateCpuPercent;
    listVolumes(filters?: VolumeFilters): Promise<VolumeInfo[]>;
    createVolume(config: CreateVolumeConfig): Promise<string>;
    getVolume(name: string): Promise<VolumeInfo>;
    removeVolume(name: string, force?: boolean): Promise<void>;
    listNetworks(filters?: NetworkFilters): Promise<NetworkInfo[]>;
    createNetwork(config: CreateNetworkConfig): Promise<string>;
    getNetwork(id: string): Promise<NetworkInfo>;
    removeNetwork(id: string): Promise<void>;
    connectContainer(networkId: string, containerId: string, options?: any): Promise<void>;
    disconnectContainer(networkId: string, containerId: string, force?: boolean): Promise<void>;
    listImages(filters?: ImageFilters): Promise<ImageInfo[]>;
    getImage(id: string): Promise<ImageInfo>;
    removeImage(id: string, force?: boolean, noprune?: boolean): Promise<any>;
    pullImage(reference: string, auth?: any): Promise<any>;
    pruneImages(dangling?: boolean, until?: Date): Promise<any>;
    getSystemInfo(): Promise<any>;
}
