import { Injectable, Logger } from '@nestjs/common';
import { DockerService } from './docker.service';
import { DockerEventsService } from './docker-events.service';
import { JobsService } from './jobs.service';
import { User } from '../../../entities/user.entity';
import {
  ImageFilters,
  ImageInfo
} from '../interfaces/docker.interface';

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    private dockerService: DockerService,
    private eventsService: DockerEventsService,
    private jobsService: JobsService
  ) {}

  async listImages(filters?: ImageFilters): Promise<ImageInfo[]> {
    try {
      return await this.dockerService.listImages(filters);
    } catch (error) {
      this.logger.error('Failed to list images', error);
      throw error;
    }
  }

  async getImage(id: string): Promise<ImageInfo> {
    return this.dockerService.getImage(id);
  }

  async pullImage(reference: string, auth: any, user: User): Promise<any> {
    try {
      // Criar job para pull
      const job = await this.jobsService.createJob(
        'pull',
        'image',
        reference,
        { auth },
        user
      );

      return {
        job_id: job.id,
        status_url: `/api/v1/docker/jobs/${job.id}`,
        websocket_url: `/ws/docker/images/pull/${job.id}`
      };
    } catch (error) {
      this.logger.error(`Failed to pull image ${reference}`, error);
      throw error;
    }
  }

  async removeImage(id: string, force: boolean, noprune: boolean, user: User): Promise<any> {
    try {
      const result = await this.dockerService.removeImage(id, force, noprune);

      // Log do evento
      await this.eventsService.logEvent({
        action: 'remove',
        resource_type: 'image',
        resource_id: id,
        details: { force, noprune },
        result: 'success',
        user,
        ip_address: null,
        user_agent: null
      });

      return result;
    } catch (error) {
      // Log do erro
      await this.eventsService.logEvent({
        action: 'remove',
        resource_type: 'image',
        resource_id: id,
        details: { force, noprune },
        result: 'error',
        error_message: error.message,
        user,
        ip_address: null,
        user_agent: null
      });

      throw error;
    }
  }

  async pruneImages(options: any, user: User): Promise<any> {
    try {
      if (options.dry_run) {
        // Simular prune para mostrar preview
        const result = await this.dockerService.pruneImages(options.dangling_only,
          options.until ? new Date(options.until) : undefined);

        return {
          ...result,
          dry_run: true,
          message: 'This is a preview. Use dry_run=false to actually remove images.'
        };
      }

      // Criar job para prune real
      const job = await this.jobsService.createJob(
        'prune',
        'image',
        'all',
        {
          dangling_only: options.dangling_only,
          until: options.until
        },
        user
      );

      return {
        job_id: job.id,
        status_url: `/api/v1/docker/jobs/${job.id}`
      };
    } catch (error) {
      this.logger.error('Failed to prune images', error);
      throw error;
    }
  }
}