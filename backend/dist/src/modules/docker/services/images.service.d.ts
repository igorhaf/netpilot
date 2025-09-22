import { DockerService } from './docker.service';
import { DockerEventsService } from './docker-events.service';
import { JobsService } from './jobs.service';
import { User } from '../../../entities/user.entity';
import { ImageFilters, ImageInfo } from '../interfaces/docker.interface';
export declare class ImagesService {
    private dockerService;
    private eventsService;
    private jobsService;
    private readonly logger;
    constructor(dockerService: DockerService, eventsService: DockerEventsService, jobsService: JobsService);
    listImages(filters?: ImageFilters): Promise<ImageInfo[]>;
    getImage(id: string): Promise<ImageInfo>;
    pullImage(reference: string, auth: any, user: User): Promise<any>;
    removeImage(id: string, force: boolean, noprune: boolean, user: User): Promise<any>;
    pruneImages(options: any, user: User): Promise<any>;
}
