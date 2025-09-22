import { User } from '../../../entities/user.entity';
export declare class DockerQuota {
    id: string;
    user: User;
    max_containers: number;
    max_volumes: number;
    max_networks: number;
    max_volume_size: number;
    max_actions_per_minute: number;
    max_exec_timeout: number;
    created_at: Date;
    updated_at: Date;
}
