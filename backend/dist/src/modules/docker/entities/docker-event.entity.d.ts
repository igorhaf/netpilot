import { User } from '../../../entities/user.entity';
export declare class DockerEvent {
    id: string;
    action: string;
    resource_type: string;
    resource_id: string;
    resource_name: string;
    details: any;
    result: string;
    error_message: string;
    user: User;
    ip_address: string;
    user_agent: string;
    created_at: Date;
    timestamp: Date;
}
