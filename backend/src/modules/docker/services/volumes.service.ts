import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DockerService } from './docker.service';
import { DockerEventsService } from './docker-events.service';
import { DockerMetricsService } from './docker-metrics.service';
import { JobsService } from './jobs.service';
import { DockerBackup } from '../entities/docker-backup.entity';
import { User } from '../../../entities/user.entity';
import {
  VolumeFilters,
  VolumeInfo,
  CreateVolumeConfig
} from '../interfaces/docker.interface';

@Injectable()
export class VolumesService {
  private readonly logger = new Logger(VolumesService.name);

  constructor(
    private dockerService: DockerService,
    private eventsService: DockerEventsService,
    private metricsService: DockerMetricsService,
    private jobsService: JobsService,
    @InjectRepository(DockerBackup)
    private backupRepo: Repository<DockerBackup>
  ) {}

  async listVolumes(filters?: VolumeFilters): Promise<VolumeInfo[]> {
    try {
      const volumes = await this.dockerService.listVolumes(filters);

      // Atualizar métricas
      this.metricsService.updateVolumeUsage(volumes);

      return volumes;
    } catch (error) {
      this.logger.error('Failed to list volumes', error);
      throw error;
    }
  }

  async createVolume(config: CreateVolumeConfig, user: User): Promise<VolumeInfo> {
    const startTime = Date.now();

    try {
      // Criar volume
      const volumeName = await this.dockerService.createVolume(config);

      // Buscar informações do volume criado
      const volumeInfo = await this.dockerService.getVolume(volumeName);

      // Log do evento
      await this.eventsService.logEvent({
        action: 'create',
        resource_type: 'volume',
        resource_id: volumeName,
        resource_name: config.name,
        details: { driver: config.driver },
        result: 'success',
        user,
        ip_address: null,
        user_agent: null
      });

      return volumeInfo;
    } catch (error) {
      // Log do erro
      await this.eventsService.logEvent({
        action: 'create',
        resource_type: 'volume',
        resource_id: config.name,
        resource_name: config.name,
        details: { driver: config.driver },
        result: 'error',
        error_message: error.message,
        user,
        ip_address: null,
        user_agent: null
      });

      throw error;
    }
  }

  async getVolume(name: string): Promise<VolumeInfo> {
    return this.dockerService.getVolume(name);
  }

  async removeVolume(name: string, force: boolean, user: User): Promise<void> {
    const startTime = Date.now();

    try {
      await this.dockerService.removeVolume(name, force);

      // Log do evento
      await this.eventsService.logEvent({
        action: 'remove',
        resource_type: 'volume',
        resource_id: name,
        resource_name: name,
        details: { force },
        result: 'success',
        user,
        ip_address: null,
        user_agent: null
      });
    } catch (error) {
      // Log do erro
      await this.eventsService.logEvent({
        action: 'remove',
        resource_type: 'volume',
        resource_id: name,
        resource_name: name,
        details: { force },
        result: 'error',
        error_message: error.message,
        user,
        ip_address: null,
        user_agent: null
      });

      throw error;
    }
  }

  async createBackup(volumeName: string, options: any, user: User): Promise<any> {
    try {
      // Verificar se volume existe
      await this.dockerService.getVolume(volumeName);

      // Criar job de backup
      const job = await this.jobsService.createJob(
        'backup',
        'volume',
        volumeName,
        {
          description: options.description,
          tags: options.tags
        },
        user
      );

      return {
        job_id: job.id,
        status_url: `/api/v1/docker/jobs/${job.id}`
      };
    } catch (error) {
      this.logger.error(`Failed to create backup for volume ${volumeName}`, error);
      throw error;
    }
  }

  async getBackups(volumeName: string): Promise<DockerBackup[]> {
    return await this.backupRepo.find({
      where: { volume_name: volumeName },
      order: { created_at: 'DESC' },
      relations: ['created_by', 'restored_by']
    });
  }

  async restoreBackup(volumeName: string, backupId: string, force: boolean, user: User): Promise<any> {
    try {
      // Verificar se backup existe
      const backup = await this.backupRepo.findOne({
        where: { id: backupId, volume_name: volumeName }
      });

      if (!backup) {
        throw new Error('Backup not found');
      }

      // Criar job de restore
      const job = await this.jobsService.createJob(
        'restore',
        'volume',
        volumeName,
        {
          backup_id: backupId,
          force
        },
        user
      );

      return {
        job_id: job.id,
        status_url: `/api/v1/docker/jobs/${job.id}`
      };
    } catch (error) {
      this.logger.error(`Failed to restore backup ${backupId} for volume ${volumeName}`, error);
      throw error;
    }
  }
}