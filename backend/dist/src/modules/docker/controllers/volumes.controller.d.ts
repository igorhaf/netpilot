import { VolumesService } from '../services/volumes.service';
import { CreateVolumeDto } from '../dto/volumes/create-volume.dto';
import { VolumeBackupDto } from '../dto/volumes/volume-backup.dto';
export declare class VolumesController {
    private volumesService;
    constructor(volumesService: VolumesService);
    listVolumes(driver?: string, dangling?: boolean): Promise<import("../interfaces/docker.interface").VolumeInfo[]>;
    createVolume(createVolumeDto: CreateVolumeDto, req: any): Promise<import("../interfaces/docker.interface").VolumeInfo>;
    getVolume(name: string): Promise<import("../interfaces/docker.interface").VolumeInfo>;
    removeVolume(name: string, force: boolean, req: any): Promise<void>;
    createVolumeBackup(name: string, backupDto: VolumeBackupDto, req: any): Promise<any>;
    getVolumeBackups(name: string): Promise<import("../entities/docker-backup.entity").DockerBackup[]>;
}
