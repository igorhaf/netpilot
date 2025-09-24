import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import * as Docker from 'dockerode';

@Controller('docker')
// @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
export class DockerMinimalController {
  private docker: Docker;

  constructor() {
    this.docker = new Docker({
      socketPath: '/var/run/docker.sock'
    });
    console.log('🐳 DockerMinimalController initialized with Docker API');
  }

  @Get('test')
  test() {
    console.log('🧪 Docker test endpoint called');
    return {
      message: 'Docker API controller is working',
      timestamp: new Date().toISOString()
    };
  }

  @Get('containers')
  async listContainers() {
    try {
      const containers = await this.docker.listContainers({ all: true });

      const containerData = containers.map(container => ({
        id: container.Id,
        names: container.Names,
        image: container.Image,
        imageID: container.ImageID,
        command: container.Command,
        created: new Date(container.Created * 1000),
        ports: container.Ports,
        labels: container.Labels,
        state: container.State,
        status: container.Status,
        hostConfig: container.HostConfig,
        networkSettings: container.NetworkSettings,
        mounts: container.Mounts
      }));

      return {
        data: containerData,
        total: containerData.length,
        message: `Found ${containerData.length} containers`
      };
    } catch (error) {
      console.error('Docker API Error:', error);
      return {
        data: [],
        total: 0,
        error: error.message,
        message: 'Failed to fetch containers from Docker API'
      };
    }
  }

  @Get('images')
  async listImages() {
    try {
      const images = await this.docker.listImages();

      const imageData = images.map(image => ({
        id: image.Id,
        parentId: image.ParentId,
        repoTags: image.RepoTags || [],
        repoDigests: image.RepoDigests || [],
        created: new Date(image.Created * 1000),
        size: image.Size,
        virtualSize: image.VirtualSize,
        sharedSize: image.SharedSize,
        labels: image.Labels || {},
        containers: image.Containers || 0
      }));

      const totalSize = images.reduce((sum, img) => sum + (img.Size || 0), 0);

      return {
        data: imageData,
        total: imageData.length,
        totalSize: totalSize,
        message: `Found ${imageData.length} images`
      };
    } catch (error) {
      console.error('Docker Images API Error:', error);
      return {
        data: [],
        total: 0,
        totalSize: 0,
        error: error.message,
        message: 'Failed to fetch images from Docker API'
      };
    }
  }

  @Get('volumes')
  async listVolumes() {
    try {
      const volumesInfo = await this.docker.listVolumes();
      const volumes = volumesInfo.Volumes || [];

      const volumeData = volumes.map(volume => ({
        name: volume.Name,
        driver: volume.Driver,
        mountpoint: volume.Mountpoint,
        created: null, // Docker volume API doesn't provide CreatedAt
        scope: volume.Scope,
        labels: volume.Labels || {},
        options: volume.Options || {}
      }));

      return {
        data: volumeData,
        total: volumeData.length,
        message: `Found ${volumeData.length} volumes`
      };
    } catch (error) {
      console.error('Docker Volumes API Error:', error);
      return {
        data: [],
        total: 0,
        error: error.message,
        message: 'Failed to fetch volumes from Docker API'
      };
    }
  }

  @Get('networks')
  async listNetworks() {
    try {
      const networks = await this.docker.listNetworks();

      const networkData = networks.map(network => ({
        id: network.Id,
        name: network.Name,
        created: new Date(network.Created),
        scope: network.Scope,
        driver: network.Driver,
        enableIPv6: network.EnableIPv6,
        internal: network.Internal,
        attachable: network.Attachable,
        ingress: network.Ingress,
        configOnly: network.ConfigOnly,
        containers: network.Containers ? Object.keys(network.Containers).length : 0,
        options: network.Options || {},
        labels: network.Labels || {}
      }));

      const customNetworks = networkData.filter(net =>
        !['bridge', 'host', 'none'].includes(net.name)
      );

      return {
        data: networkData,
        total: networkData.length,
        custom: customNetworks.length,
        message: `Found ${networkData.length} networks`
      };
    } catch (error) {
      console.error('Docker Networks API Error:', error);
      return {
        data: [],
        total: 0,
        custom: 0,
        error: error.message,
        message: 'Failed to fetch networks from Docker API'
      };
    }
  }

  @Get('dashboard')
  async getDashboardData() {
    try {
      // Get containers data
      const containers = await this.docker.listContainers({ all: true });
      const runningContainers = containers.filter(c => c.State === 'running');
      const stoppedContainers = containers.filter(c => c.State === 'exited');

      // Get volumes data
      const volumesInfo = await this.docker.listVolumes();
      const volumes = volumesInfo.Volumes || [];

      // Get networks data
      const networks = await this.docker.listNetworks();
      const customNetworks = networks.filter(net =>
        !['bridge', 'host', 'none'].includes(net.Name)
      );

      // Get images data
      const images = await this.docker.listImages();
      const totalImagesSize = images.reduce((sum, img) => sum + (img.Size || 0), 0);

      // Format size in human readable format
      const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
      };

      return {
        containers: {
          total: containers.length,
          running: runningContainers.length,
          stopped: stoppedContainers.length
        },
        volumes: {
          total: volumes.length,
          used_space: formatBytes(0) // Docker API doesn't provide volume size easily
        },
        networks: {
          total: networks.length,
          custom: customNetworks.length
        },
        images: {
          total: images.length,
          total_size: formatBytes(totalImagesSize)
        },
        active_jobs: [] // No real jobs system yet
      };
    } catch (error) {
      console.error('Docker Dashboard API Error:', error);
      return {
        containers: { total: 0, running: 0, stopped: 0 },
        volumes: { total: 0, used_space: '0 B' },
        networks: { total: 0, custom: 0 },
        images: { total: 0, total_size: '0 B' },
        active_jobs: [],
        error: error.message
      };
    }
  }

  @Get('jobs')
  listJobs() {
    return {
      data: [],
      message: 'Docker jobs endpoint working - implementation needed'
    };
  }

  @Post('containers/:id/start')
  async startContainer(@Param('id') id: string) {
    try {
      const container = this.docker.getContainer(id);
      await container.start();

      return {
        success: true,
        message: `Container ${id.substring(0, 12)} started successfully`
      };
    } catch (error) {
      console.error(`Error starting container ${id}:`, error);
      return {
        success: false,
        message: error.message || 'Failed to start container'
      };
    }
  }

  @Post('containers/:id/stop')
  async stopContainer(@Param('id') id: string) {
    try {
      const container = this.docker.getContainer(id);
      await container.stop();

      return {
        success: true,
        message: `Container ${id.substring(0, 12)} stopped successfully`
      };
    } catch (error) {
      console.error(`Error stopping container ${id}:`, error);
      return {
        success: false,
        message: error.message || 'Failed to stop container'
      };
    }
  }

  @Post('containers/:id/restart')
  async restartContainer(@Param('id') id: string) {
    try {
      const container = this.docker.getContainer(id);
      await container.restart();

      return {
        success: true,
        message: `Container ${id.substring(0, 12)} restarted successfully`
      };
    } catch (error) {
      console.error(`Error restarting container ${id}:`, error);
      return {
        success: false,
        message: error.message || 'Failed to restart container'
      };
    }
  }

  @Get('containers/:id/logs')
  async getContainerLogs(@Param('id') id: string) {
    try {
      const container = this.docker.getContainer(id);
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: 100,
        timestamps: true
      });

      return {
        logs: logs.toString(),
        success: true
      };
    } catch (error) {
      console.error(`Error getting logs for container ${id}:`, error);
      return {
        logs: '',
        success: false,
        message: error.message || 'Failed to get container logs'
      };
    }
  }
}