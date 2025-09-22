export declare class VolumeBackupDto {
    description?: string;
    tags?: string[];
}
export declare class VolumeRestoreDto {
    backup_id: string;
    force?: boolean;
}
