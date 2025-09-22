import { User } from '../../../entities/user.entity';
export declare class DockerBackup {
    id: string;
    volume_name: string;
    file_path: string;
    file_hash: string;
    file_size: number;
    description: string;
    tags: string[];
    metadata: any;
    created_by: User;
    created_at: Date;
    restored_at: Date;
    restored_by: User;
}
