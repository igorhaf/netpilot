import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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

@Injectable()
export class DockerEventsService {
  constructor(
    @InjectRepository(DockerEvent)
    private eventsRepo: Repository<DockerEvent>
  ) {}

  async logEvent(data: CreateEventData): Promise<DockerEvent> {
    const event = this.eventsRepo.create({
      action: data.action,
      resource_type: data.resource_type,
      resource_id: data.resource_id,
      resource_name: data.resource_name,
      details: data.details,
      result: data.result,
      error_message: data.error_message,
      user: data.user,
      ip_address: data.ip_address,
      user_agent: data.user_agent
    });

    return await this.eventsRepo.save(event);
  }

  async getEvents(filters?: {
    user_id?: string;
    resource_type?: string;
    action?: string;
    result?: 'success' | 'error';
    since?: Date;
    until?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ events: DockerEvent[]; total: number }> {
    const query = this.eventsRepo.createQueryBuilder('event')
      .leftJoinAndSelect('event.user', 'user')
      .orderBy('event.created_at', 'DESC');

    if (filters?.user_id) {
      query.andWhere('event.user_id = :userId', { userId: filters.user_id });
    }

    if (filters?.resource_type) {
      query.andWhere('event.resource_type = :resourceType', { resourceType: filters.resource_type });
    }

    if (filters?.action) {
      query.andWhere('event.action = :action', { action: filters.action });
    }

    if (filters?.result) {
      query.andWhere('event.result = :result', { result: filters.result });
    }

    if (filters?.since) {
      query.andWhere('event.created_at >= :since', { since: filters.since });
    }

    if (filters?.until) {
      query.andWhere('event.created_at <= :until', { until: filters.until });
    }

    const total = await query.getCount();

    if (filters?.limit) {
      query.limit(filters.limit);
    }

    if (filters?.offset) {
      query.offset(filters.offset);
    }

    const events = await query.getMany();

    return { events, total };
  }

  async getEventStats(since?: Date): Promise<any> {
    const query = this.eventsRepo.createQueryBuilder('event');

    if (since) {
      query.where('event.created_at >= :since', { since });
    }

    const total = await query.getCount();

    const byAction = await query
      .select('event.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('event.action')
      .getRawMany();

    const byResult = await query
      .select('event.result', 'result')
      .addSelect('COUNT(*)', 'count')
      .groupBy('event.result')
      .getRawMany();

    const byResourceType = await query
      .select('event.resource_type', 'resource_type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('event.resource_type')
      .getRawMany();

    return {
      total,
      by_action: byAction,
      by_result: byResult,
      by_resource_type: byResourceType
    };
  }
}