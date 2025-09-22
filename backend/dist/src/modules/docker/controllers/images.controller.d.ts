import { ImagesService } from '../services/images.service';
export declare class ImagesController {
    private imagesService;
    constructor(imagesService: ImagesService);
    listImages(dangling?: boolean, reference?: string): Promise<import("../interfaces/docker.interface").ImageInfo[]>;
    pullImage(pullDto: {
        reference: string;
        auth?: any;
    }, req: any): Promise<any>;
    getImage(id: string): Promise<import("../interfaces/docker.interface").ImageInfo>;
    removeImage(id: string, req: any, force?: boolean, noprune?: boolean): Promise<any>;
    pruneImages(pruneDto: {
        dry_run?: boolean;
        dangling_only?: boolean;
        until?: string;
    }, req: any): Promise<any>;
}
