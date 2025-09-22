import { NetworksService } from '../services/networks.service';
export declare class NetworksController {
    private networksService;
    constructor(networksService: NetworksService);
    listNetworks(driver?: string, scope?: string): Promise<import("../interfaces/docker.interface").NetworkInfo[]>;
    createNetwork(createNetworkDto: any, req: any): Promise<import("../interfaces/docker.interface").NetworkInfo>;
    getNetwork(id: string): Promise<import("../interfaces/docker.interface").NetworkInfo>;
    removeNetwork(id: string, req: any): Promise<void>;
    connectContainer(id: string, connectDto: any, req: any): Promise<any>;
    disconnectContainer(id: string, disconnectDto: any, req: any): Promise<any>;
}
