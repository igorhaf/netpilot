import { ContainersService } from '../services/containers.service';
import { CreateContainerDto } from '../dto/containers/create-container.dto';
import { ContainerActionDto } from '../dto/containers/container-action.dto';
import { ContainerExecDto } from '../dto/containers/container-exec.dto';
export declare class ContainersController {
    private containersService;
    constructor(containersService: ContainersService);
    listContainers(status?: string, image?: string, name?: string, label?: string, page?: number, limit?: number): Promise<{
        data: import("../interfaces/docker.interface").ContainerInfo[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    createContainer(createContainerDto: CreateContainerDto, req: any): Promise<import("../interfaces/docker.interface").ContainerInfo>;
    getContainer(id: string): Promise<any>;
    removeContainer(id: string, force: boolean, req: any): Promise<void>;
    containerAction(id: string, action: string, actionDto: ContainerActionDto, req: any): Promise<{
        message: string;
        status: string;
    }>;
    getContainerLogs(id: string, tail?: number, since?: string, until?: string, follow?: boolean): Promise<any>;
    execContainer(id: string, execDto: ContainerExecDto, req: any): Promise<any>;
    getContainerStats(id: string, stream?: boolean): Promise<import("../interfaces/docker.interface").ContainerStats | {
        websocket_url: string;
    }>;
}
