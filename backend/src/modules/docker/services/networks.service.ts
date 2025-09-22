import { Injectable, Logger } from '@nestjs/common';
import { DockerService } from './docker.service';
import { DockerEventsService } from './docker-events.service';
import { User } from '../../../entities/user.entity';
import {
  NetworkFilters,
  NetworkInfo,
  CreateNetworkConfig
} from '../interfaces/docker.interface';

@Injectable()
export class NetworksService {
  private readonly logger = new Logger(NetworksService.name);

  constructor(
    private dockerService: DockerService,
    private eventsService: DockerEventsService
  ) {}

  async listNetworks(filters?: NetworkFilters): Promise<NetworkInfo[]> {
    try {
      return await this.dockerService.listNetworks(filters);
    } catch (error) {
      this.logger.error('Failed to list networks', error);
      throw error;
    }
  }

  async createNetwork(config: CreateNetworkConfig, user: User): Promise<NetworkInfo> {
    try {
      const networkId = await this.dockerService.createNetwork(config);
      const networkInfo = await this.dockerService.getNetwork(networkId);

      // Log do evento
      await this.eventsService.logEvent({
        action: 'create',
        resource_type: 'network',
        resource_id: networkId,
        resource_name: config.name,
        details: { driver: config.driver },
        result: 'success',
        user,
        ip_address: null,
        user_agent: null
      });

      return networkInfo;
    } catch (error) {
      // Log do erro
      await this.eventsService.logEvent({
        action: 'create',
        resource_type: 'network',
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

  async getNetwork(id: string): Promise<NetworkInfo> {
    return this.dockerService.getNetwork(id);
  }

  async removeNetwork(id: string, user: User): Promise<void> {
    try {
      await this.dockerService.removeNetwork(id);

      // Log do evento
      await this.eventsService.logEvent({
        action: 'remove',
        resource_type: 'network',
        resource_id: id,
        result: 'success',
        user,
        ip_address: null,
        user_agent: null
      });
    } catch (error) {
      // Log do erro
      await this.eventsService.logEvent({
        action: 'remove',
        resource_type: 'network',
        resource_id: id,
        result: 'error',
        error_message: error.message,
        user,
        ip_address: null,
        user_agent: null
      });

      throw error;
    }
  }

  async connectContainer(networkId: string, connectDto: any, user: User): Promise<any> {
    try {
      if (connectDto.dry_run) {
        // Apenas validar se é possível conectar
        await this.dockerService.getNetwork(networkId);
        return { message: 'Dry run successful - container can be connected' };
      }

      await this.dockerService.connectContainer(networkId, connectDto.container, {
        aliases: connectDto.aliases,
        ipv4_address: connectDto.ipv4_address
      });

      // Log do evento
      await this.eventsService.logEvent({
        action: 'connect',
        resource_type: 'network',
        resource_id: networkId,
        details: { container: connectDto.container },
        result: 'success',
        user,
        ip_address: null,
        user_agent: null
      });

      return { message: 'Container connected successfully' };
    } catch (error) {
      // Log do erro
      await this.eventsService.logEvent({
        action: 'connect',
        resource_type: 'network',
        resource_id: networkId,
        details: { container: connectDto.container },
        result: 'error',
        error_message: error.message,
        user,
        ip_address: null,
        user_agent: null
      });

      throw error;
    }
  }

  async disconnectContainer(networkId: string, disconnectDto: any, user: User): Promise<any> {
    try {
      await this.dockerService.disconnectContainer(networkId, disconnectDto.container, disconnectDto.force);

      // Log do evento
      await this.eventsService.logEvent({
        action: 'disconnect',
        resource_type: 'network',
        resource_id: networkId,
        details: { container: disconnectDto.container, force: disconnectDto.force },
        result: 'success',
        user,
        ip_address: null,
        user_agent: null
      });

      return { message: 'Container disconnected successfully' };
    } catch (error) {
      // Log do erro
      await this.eventsService.logEvent({
        action: 'disconnect',
        resource_type: 'network',
        resource_id: networkId,
        details: { container: disconnectDto.container, force: disconnectDto.force },
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