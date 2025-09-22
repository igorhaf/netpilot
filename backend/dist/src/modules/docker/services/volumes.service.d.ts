import { Repository } from 'typeorm';
import { DockerService } from './docker.service';
import { DockerEventsService } from './docker-events.service';
import { DockerMetricsService } from './docker-metrics.service';
import { JobsService } from './jobs.service';
import { DockerBackup } from '../entities/docker-backup.entity';
import { User } from '../../../entities/user.entity';
import { VolumeFilters, VolumeInfo, CreateVolumeConfig } from '../interfaces/docker.interface';
export declare class VolumesService {
    private dockerService;
    private eventsService;
    private metricsService;
    private jobsService;
    private backupRepo;
    private readonly logger;
    constructor(dockerService: DockerService, eventsService: DockerEventsService, metricsService: DockerMetricsService, jobsService: JobsService, backupRepo: Repository<DockerBackup>);
    listVolumes(filters?: VolumeFilters): Promise<VolumeInfo[]>;
    createVolume(config: CreateVolumeConfig, user: User): Promise<VolumeInfo>;
    getVolume(name: string): Promise<VolumeInfo>;
    removeVolume(name: string, force: boolean, user: User): Promise<void>;
    createBackup(volumeName: string, options: any, user: User): Promise<any>;
    getBackups(volumeName: string): Promise<DockerBackup[]>;
    restoreBackup(volumeName: string, backupId: string, force: boolean, user: User): Promise<any>;
}
