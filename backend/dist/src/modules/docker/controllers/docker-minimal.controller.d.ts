import * as Docker from 'dockerode';
export declare class DockerMinimalController {
    private docker;
    constructor();
    test(): {
        message: string;
        timestamp: string;
    };
    listContainers(): Promise<{
        data: {
            id: string;
            names: string[];
            image: string;
            imageID: string;
            command: string;
            created: Date;
            ports: Docker.Port[];
            labels: {
                [label: string]: string;
            };
            state: string;
            status: string;
            hostConfig: {
                NetworkMode: string;
            };
            networkSettings: {
                Networks: {
                    [networkType: string]: Docker.NetworkInfo;
                };
            };
            mounts: {
                Name?: string | undefined;
                Type: string;
                Source: string;
                Destination: string;
                Driver?: string | undefined;
                Mode: string;
                RW: boolean;
                Propagation: string;
            }[];
        }[];
        total: number;
        message: string;
        error?: undefined;
    } | {
        data: any[];
        total: number;
        error: any;
        message: string;
    }>;
    listImages(): Promise<{
        data: {
            id: string;
            parentId: string;
            repoTags: string[];
            repoDigests: string[];
            created: Date;
            size: number;
            virtualSize: number;
            sharedSize: number;
            labels: {
                [label: string]: string;
            };
            containers: number;
        }[];
        total: number;
        totalSize: number;
        message: string;
        error?: undefined;
    } | {
        data: any[];
        total: number;
        totalSize: number;
        error: any;
        message: string;
    }>;
    listVolumes(): Promise<{
        data: {
            name: string;
            driver: string;
            mountpoint: string;
            created: any;
            scope: "global" | "local";
            labels: {
                [key: string]: string;
            };
            options: {
                [key: string]: string;
            };
        }[];
        total: number;
        message: string;
        error?: undefined;
    } | {
        data: any[];
        total: number;
        error: any;
        message: string;
    }>;
    listNetworks(): Promise<{
        data: {
            id: string;
            name: string;
            created: Date;
            scope: string;
            driver: string;
            enableIPv6: boolean;
            internal: boolean;
            attachable: boolean;
            ingress: boolean;
            configOnly: boolean;
            containers: number;
            options: {
                [key: string]: string;
            };
            labels: {
                [key: string]: string;
            };
        }[];
        total: number;
        custom: number;
        message: string;
        error?: undefined;
    } | {
        data: any[];
        total: number;
        custom: number;
        error: any;
        message: string;
    }>;
    getDashboardData(): Promise<{
        containers: {
            total: number;
            running: number;
            stopped: number;
        };
        volumes: {
            total: number;
            used_space: string;
        };
        networks: {
            total: number;
            custom: number;
        };
        images: {
            total: number;
            total_size: string;
        };
        active_jobs: any[];
        error?: undefined;
    } | {
        containers: {
            total: number;
            running: number;
            stopped: number;
        };
        volumes: {
            total: number;
            used_space: string;
        };
        networks: {
            total: number;
            custom: number;
        };
        images: {
            total: number;
            total_size: string;
        };
        active_jobs: any[];
        error: any;
    }>;
    listJobs(): {
        data: any[];
        message: string;
    };
    startContainer(id: string): Promise<{
        success: boolean;
        message: any;
    }>;
    stopContainer(id: string): Promise<{
        success: boolean;
        message: any;
    }>;
    restartContainer(id: string): Promise<{
        success: boolean;
        message: any;
    }>;
    getContainerLogs(id: string): Promise<{
        logs: string;
        success: boolean;
        message?: undefined;
    } | {
        logs: string;
        success: boolean;
        message: any;
    }>;
}
