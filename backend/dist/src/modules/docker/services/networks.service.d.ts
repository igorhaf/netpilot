import { DockerService } from './docker.service';
import { DockerEventsService } from './docker-events.service';
import { User } from '../../../entities/user.entity';
import { NetworkFilters, NetworkInfo, CreateNetworkConfig } from '../interfaces/docker.interface';
export declare class NetworksService {
    private dockerService;
    private eventsService;
    private readonly logger;
    constructor(dockerService: DockerService, eventsService: DockerEventsService);
    listNetworks(filters?: NetworkFilters): Promise<NetworkInfo[]>;
    createNetwork(config: CreateNetworkConfig, user: User): Promise<NetworkInfo>;
    getNetwork(id: string): Promise<NetworkInfo>;
    removeNetwork(id: string, user: User): Promise<void>;
    connectContainer(networkId: string, connectDto: any, user: User): Promise<any>;
    disconnectContainer(networkId: string, disconnectDto: any, user: User): Promise<any>;
}
