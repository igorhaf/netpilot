import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DockerService } from './docker.service';
import { DockerEventsService } from './docker-events.service';
import { DockerMetricsService } from './docker-metrics.service';
import { DockerEvent } from '../entities/docker-event.entity';
import { User } from '../../../entities/user.entity';
import {
  ContainerFilters,
  ContainerInfo,
  CreateContainerConfig,
  ContainerAction,
  LogOptions,
  LogEntry,
  ContainerStats
} from '../interfaces/docker.interface';

@Injectable()
export class ContainersService {
  private readonly logger = new Logger(ContainersService.name);

  constructor(
    private dockerService: DockerService,
    private eventsService: DockerEventsService,
    private metricsService: DockerMetricsService
  ) {}

  async listContainers(filters?: ContainerFilters): Promise<{ data: ContainerInfo[]; total: number }> {
    const startTime = Date.now();

    try {
      const containers = await this.dockerService.listContainers(filters);

      // Atualizar métricas
      this.metricsService.updateContainerStats(containers);

      return {
        data: containers,
        total: containers.length
      };
    } catch (error) {
      this.logger.error('Failed to list containers', error);
      throw error;
    }
  }

  async createContainer(config: CreateContainerConfig, user: User): Promise<ContainerInfo> {
    const startTime = Date.now();

    try {
      // Criar container
      const containerId = await this.dockerService.createContainer(config);

      // Buscar informações do container criado
      const containerInfo = await this.dockerService.getContainer(containerId);

      // Log do evento
      await this.eventsService.logEvent({
        action: 'create',
        resource_type: 'container',
        resource_id: containerId,
        resource_name: config.name,
        details: { image: config.image },
        result: 'success',
        user,
        ip_address: null,
        user_agent: null
      });

      // Métricas
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordContainerAction('create', 'success', user.id, duration);

      return {
        id: containerInfo.id,
        name: containerInfo.name,
        image: config.image,
        image_id: containerInfo.config?.Image || '',
        status: 'Created',
        state: 'created',
        created: new Date(),
        ports: [],
        labels: config.labels || {},
        networks: config.networks || [],
        mounts: []
      };
    } catch (error) {
      // Log do erro
      await this.eventsService.logEvent({
        action: 'create',
        resource_type: 'container',
        resource_id: 'unknown',
        resource_name: config.name,
        details: { image: config.image },
        result: 'error',
        error_message: error.message,
        user,
        ip_address: null,
        user_agent: null
      });

      // Métricas
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordContainerAction('create', 'error', user.id, duration);

      throw error;
    }
  }

  async getContainer(id: string): Promise<any> {
    return this.dockerService.getContainer(id);
  }

  async containerAction(id: string, action: ContainerAction, options: any, user: User): Promise<void> {
    const startTime = Date.now();

    try {
      // Executar ação
      await this.dockerService.containerAction(id, action, options);

      // Log do evento
      await this.eventsService.logEvent({
        action,
        resource_type: 'container',
        resource_id: id,
        details: options,
        result: 'success',
        user,
        ip_address: null,
        user_agent: null
      });

      // Métricas
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordContainerAction(action, 'success', user.id, duration);

    } catch (error) {
      // Log do erro
      await this.eventsService.logEvent({
        action,
        resource_type: 'container',
        resource_id: id,
        details: options,
        result: 'error',
        error_message: error.message,
        user,
        ip_address: null,
        user_agent: null
      });

      // Métricas
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordContainerAction(action, 'error', user.id, duration);

      throw error;
    }
  }

  async removeContainer(id: string, force: boolean, user: User): Promise<void> {
    const startTime = Date.now();

    try {
      await this.dockerService.removeContainer(id, force);

      // Log do evento
      await this.eventsService.logEvent({
        action: 'remove',
        resource_type: 'container',
        resource_id: id,
        details: { force },
        result: 'success',
        user,
        ip_address: null,
        user_agent: null
      });

      // Métricas
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordContainerAction('remove', 'success', user.id, duration);

    } catch (error) {
      // Log do erro
      await this.eventsService.logEvent({
        action: 'remove',
        resource_type: 'container',
        resource_id: id,
        details: { force },
        result: 'error',
        error_message: error.message,
        user,
        ip_address: null,
        user_agent: null
      });

      // Métricas
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordContainerAction('remove', 'error', user.id, duration);

      throw error;
    }
  }

  async getContainerLogs(id: string, options: LogOptions): Promise<LogEntry[]> {
    try {
      return await this.dockerService.getContainerLogs(id, options);
    } catch (error) {
      this.logger.error(`Failed to get logs for container ${id}`, error);
      throw error;
    }
  }

  async getContainerStats(id: string): Promise<ContainerStats> {
    try {
      return await this.dockerService.getContainerStats(id);
    } catch (error) {
      this.logger.error(`Failed to get stats for container ${id}`, error);
      throw error;
    }
  }

  async createExecSession(id: string, command: string[], options: any, user: User): Promise<any> {
    try {
      // Log do evento
      await this.eventsService.logEvent({
        action: 'exec',
        resource_type: 'container',
        resource_id: id,
        details: { command, options },
        result: 'success',
        user,
        ip_address: null,
        user_agent: null
      });

      // TODO: Implementar criação de sessão exec com WebSocket
      return {
        exec_id: 'mock-exec-id',
        websocket_url: `/ws/docker/containers/${id}/exec/mock-exec-id`
      };
    } catch (error) {
      // Log do erro
      await this.eventsService.logEvent({
        action: 'exec',
        resource_type: 'container',
        resource_id: id,
        details: { command, options },
        result: 'error',
        error_message: error.message,
        user,
        ip_address: null,
        user_agent: null
      });

      throw error;
    }
  }
}