import { Repository } from 'typeorm';
import { DockerEvent } from '../entities/docker-event.entity';
import { User } from '../../../entities/user.entity';
interface CreateEventData {
    action: string;
    resource_type: string;
    resource_id: string;
    resource_name?: string;
    details?: any;
    result: 'success' | 'error';
    error_message?: string;
    user: User;
    ip_address?: string;
    user_agent?: string;
}
export declare class DockerEventsService {
    private eventsRepo;
    constructor(eventsRepo: Repository<DockerEvent>);
    logEvent(data: CreateEventData): Promise<DockerEvent>;
    getEvents(filters?: {
        user_id?: string;
        resource_type?: string;
        action?: string;
        result?: 'success' | 'error';
        since?: Date;
        until?: Date;
        limit?: number;
        offset?: number;
    }): Promise<{
        events: DockerEvent[];
        total: number;
    }>;
    getEventStats(since?: Date): Promise<any>;
}
export {};
