import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { DockerService } from '../../docker/services/docker.service';
import { ContainersService } from '../../docker/services/containers.service';
import { EventEmitter } from 'events';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

interface ActiveLogStream {
  stream: any; // Docker log stream type varies
  containerId: string;
  userId: string;
  startedAt: Date;
  lastActivity: Date;
}

interface ActiveStatsStream {
  stream: any; // Docker stats stream type varies
  containerId: string;
  userId: string;
  startedAt: Date;
  lastActivity: Date;
}

interface ActiveExecSession {
  exec: any;
  stream: any; // Docker exec stream type varies
  execId: string;
  containerId: string;
  userId: string;
  startedAt: Date;
  lastActivity: Date;
}

@Injectable()
export class DockerWebSocketHandler {
  private readonly logger = new Logger(DockerWebSocketHandler.name);
  private server: Server;
  private activeLogStreams: Map<string, ActiveLogStream> = new Map();
  private activeStatsStreams: Map<string, ActiveStatsStream> = new Map();
  private activeExecSessions: Map<string, ActiveExecSession> = new Map();

  constructor(
    private readonly dockerService: DockerService,
    private readonly containersService: ContainersService
  ) {
    setInterval(() => this.cleanupInactiveStreams(), 5 * 60 * 1000);
  }

  setServer(server: Server) {
    this.server = server;
  }

  // ============================
  // LOGS STREAMING
  // ============================

  async handleLogsStart(client: AuthenticatedSocket, data: { containerId: string; tail?: number; follow?: boolean }) {
    try {
      if (!client.userId) {
        client.emit('docker:error', { message: 'Not authenticated' });
        return;
      }

      const streamKey = `${client.userId}:${data.containerId}:logs`;

      if (this.activeLogStreams.has(streamKey)) {
        await this.handleLogsStop(client, { containerId: data.containerId });
      }

      const container = this.dockerService.getDockerContainer(data.containerId);

      // Verify container exists
      try {
        await container.inspect();
      } catch (error) {
        client.emit('docker:error', {
          containerId: data.containerId,
          message: 'Container not found'
        });
        return;
      }

      const followStream = data.follow !== false;

      let logStream: any;
      if (followStream) {
        logStream = await container.logs({
          follow: true,
          stdout: true,
          stderr: true,
          tail: data.tail || 100,
          timestamps: true
        });
      } else {
        logStream = await container.logs({
          follow: false,
          stdout: true,
          stderr: true,
          tail: data.tail || 100,
          timestamps: true
        });
      }

      const activeStream: ActiveLogStream = {
        stream: logStream,
        containerId: data.containerId,
        userId: client.userId,
        startedAt: new Date(),
        lastActivity: new Date()
      };

      this.activeLogStreams.set(streamKey, activeStream);

      client.join(`docker:logs:${data.containerId}`);
      client.emit('docker:logs:started', { containerId: data.containerId });

      logStream.on('data', (chunk: Buffer) => {
        activeStream.lastActivity = new Date();

        const output = chunk.toString();
        const lines = output.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.length > 8) {
            const isStderr = line[0] === '\x02';
            const logData = line.slice(8);

            client.emit('docker:logs:data', {
              containerId: data.containerId,
              data: logData,
              stderr: isStderr,
              timestamp: new Date()
            });
          }
        }
      });

      logStream.on('error', (error) => {
        this.logger.error(`Docker logs stream error for container ${data.containerId}:`, error);
        client.emit('docker:logs:error', {
          containerId: data.containerId,
          message: error.message
        });
        this.activeLogStreams.delete(streamKey);
      });

      logStream.on('end', () => {
        this.logger.log(`Docker logs stream ended for container ${data.containerId}`);
        client.emit('docker:logs:ended', { containerId: data.containerId });
        this.activeLogStreams.delete(streamKey);
      });

    } catch (error) {
      this.logger.error(`Docker logs start error:`, error);
      client.emit('docker:logs:error', {
        containerId: data.containerId,
        message: error.message
      });
    }
  }

  async handleLogsStop(client: AuthenticatedSocket, data: { containerId: string }) {
    try {
      if (!client.userId) return;

      const streamKey = `${client.userId}:${data.containerId}:logs`;
      const activeStream = this.activeLogStreams.get(streamKey);

      if (activeStream) {
        try {
          const stream = activeStream.stream as any;
          if (stream && typeof stream.destroy === 'function') {
            stream.destroy();
          } else if (stream && typeof stream.end === 'function') {
            stream.end();
          }
        } catch (error) {
          this.logger.warn(`Error stopping log stream: ${error.message}`);
        }
        this.activeLogStreams.delete(streamKey);
      }

      client.leave(`docker:logs:${data.containerId}`);
      client.emit('docker:logs:stopped', { containerId: data.containerId });

    } catch (error) {
      this.logger.error(`Docker logs stop error:`, error);
    }
  }

  // ============================
  // STATS STREAMING
  // ============================

  async handleStatsStart(client: AuthenticatedSocket, data: { containerId: string }) {
    try {
      if (!client.userId) {
        client.emit('docker:error', { message: 'Not authenticated' });
        return;
      }

      const streamKey = `${client.userId}:${data.containerId}:stats`;

      if (this.activeStatsStreams.has(streamKey)) {
        await this.handleStatsStop(client, { containerId: data.containerId });
      }

      const container = this.dockerService.getDockerContainer(data.containerId);

      // Verify container exists
      try {
        await container.inspect();
      } catch (error) {
        client.emit('docker:error', {
          containerId: data.containerId,
          message: 'Container not found'
        });
        return;
      }

      const statsStream = await container.stats({ stream: true });

      const activeStream: ActiveStatsStream = {
        stream: statsStream,
        containerId: data.containerId,
        userId: client.userId,
        startedAt: new Date(),
        lastActivity: new Date()
      };

      this.activeStatsStreams.set(streamKey, activeStream);

      client.join(`docker:stats:${data.containerId}`);
      client.emit('docker:stats:started', { containerId: data.containerId });

      statsStream.on('data', (chunk: Buffer) => {
        try {
          activeStream.lastActivity = new Date();
          const stats = JSON.parse(chunk.toString());

          const cpuUsage = this.calculateCpuUsage(stats);
          const memoryUsage = this.calculateMemoryUsage(stats);
          const networkIO = this.calculateNetworkIO(stats);
          const blockIO = this.calculateBlockIO(stats);

          client.emit('docker:stats:data', {
            containerId: data.containerId,
            timestamp: new Date(),
            cpu: cpuUsage,
            memory: memoryUsage,
            network: networkIO,
            block: blockIO,
            pids: stats.pids_stats?.current || 0
          });

        } catch (parseError) {
          this.logger.warn(`Failed to parse stats for container ${data.containerId}:`, parseError);
        }
      });

      statsStream.on('error', (error) => {
        this.logger.error(`Docker stats stream error for container ${data.containerId}:`, error);
        client.emit('docker:stats:error', {
          containerId: data.containerId,
          message: error.message
        });
        this.activeStatsStreams.delete(streamKey);
      });

      statsStream.on('end', () => {
        this.logger.log(`Docker stats stream ended for container ${data.containerId}`);
        client.emit('docker:stats:ended', { containerId: data.containerId });
        this.activeStatsStreams.delete(streamKey);
      });

    } catch (error) {
      this.logger.error(`Docker stats start error:`, error);
      client.emit('docker:stats:error', {
        containerId: data.containerId,
        message: error.message
      });
    }
  }

  async handleStatsStop(client: AuthenticatedSocket, data: { containerId: string }) {
    try {
      if (!client.userId) return;

      const streamKey = `${client.userId}:${data.containerId}:stats`;
      const activeStream = this.activeStatsStreams.get(streamKey);

      if (activeStream) {
        try {
          const stream = activeStream.stream as any;
          if (stream && typeof stream.destroy === 'function') {
            stream.destroy();
          } else if (stream && typeof stream.end === 'function') {
            stream.end();
          }
        } catch (error) {
          this.logger.warn(`Error stopping stats stream: ${error.message}`);
        }
        this.activeStatsStreams.delete(streamKey);
      }

      client.leave(`docker:stats:${data.containerId}`);
      client.emit('docker:stats:stopped', { containerId: data.containerId });

    } catch (error) {
      this.logger.error(`Docker stats stop error:`, error);
    }
  }

  // ============================
  // EXEC TERMINAL
  // ============================

  async handleExecStart(client: AuthenticatedSocket, data: {
    containerId: string;
    command: string[];
    interactive?: boolean;
    tty?: boolean;
    env?: string[];
  }) {
    try {
      if (!client.userId) {
        client.emit('docker:error', { message: 'Not authenticated' });
        return;
      }

      const container = this.dockerService.getDockerContainer(data.containerId);

      // Verify container exists
      try {
        await container.inspect();
      } catch (error) {
        client.emit('docker:error', {
          containerId: data.containerId,
          message: 'Container not found'
        });
        return;
      }

      const exec = await container.exec({
        Cmd: data.command,
        AttachStdout: true,
        AttachStderr: true,
        AttachStdin: data.interactive !== false,
        Tty: data.tty !== false,
        Env: data.env || []
      });

      const stream = await exec.start({
        hijack: true,
        stdin: data.interactive !== false
      });

      const execId = exec.id;
      const sessionKey = `${client.userId}:${execId}`;

      const activeSession: ActiveExecSession = {
        exec,
        stream,
        execId,
        containerId: data.containerId,
        userId: client.userId,
        startedAt: new Date(),
        lastActivity: new Date()
      };

      this.activeExecSessions.set(sessionKey, activeSession);

      client.join(`docker:exec:${execId}`);
      client.emit('docker:exec:started', {
        containerId: data.containerId,
        execId
      });

      stream.on('data', (chunk: Buffer) => {
        activeSession.lastActivity = new Date();
        client.emit('docker:exec:data', {
          execId,
          data: chunk.toString()
        });
      });

      stream.on('error', (error) => {
        this.logger.error(`Docker exec stream error for exec ${execId}:`, error);
        client.emit('docker:exec:error', {
          execId,
          message: error.message
        });
        this.activeExecSessions.delete(sessionKey);
      });

      stream.on('end', async () => {
        try {
          const execInfo = await exec.inspect();
          this.logger.log(`Docker exec session ended for exec ${execId}`);
          client.emit('docker:exec:ended', {
            execId,
            exitCode: execInfo.ExitCode
          });
        } catch (inspectError) {
          this.logger.warn(`Failed to inspect exec ${execId}:`, inspectError);
          client.emit('docker:exec:ended', { execId });
        }
        this.activeExecSessions.delete(sessionKey);
      });

    } catch (error) {
      this.logger.error(`Docker exec start error:`, error);
      client.emit('docker:exec:error', {
        containerId: data.containerId,
        message: error.message
      });
    }
  }

  async handleExecInput(client: AuthenticatedSocket, data: { execId: string; input: string }) {
    try {
      if (!client.userId) return;

      const sessionKey = `${client.userId}:${data.execId}`;
      const activeSession = this.activeExecSessions.get(sessionKey);

      if (!activeSession) {
        client.emit('docker:exec:error', {
          execId: data.execId,
          message: 'No active exec session'
        });
        return;
      }

      activeSession.lastActivity = new Date();
      activeSession.stream.write(data.input);

    } catch (error) {
      this.logger.error(`Docker exec input error:`, error);
      client.emit('docker:exec:error', {
        execId: data.execId,
        message: error.message
      });
    }
  }

  async handleExecResize(client: AuthenticatedSocket, data: { execId: string; cols: number; rows: number }) {
    try {
      if (!client.userId) return;

      const sessionKey = `${client.userId}:${data.execId}`;
      const activeSession = this.activeExecSessions.get(sessionKey);

      if (!activeSession) {
        return;
      }

      activeSession.lastActivity = new Date();
      await activeSession.exec.resize({ h: data.rows, w: data.cols });

      client.to(`docker:exec:${data.execId}`).emit('docker:exec:resize', {
        execId: data.execId,
        cols: data.cols,
        rows: data.rows
      });

    } catch (error) {
      this.logger.error(`Docker exec resize error:`, error);
    }
  }

  async handleExecStop(client: AuthenticatedSocket, data: { execId: string }) {
    try {
      if (!client.userId) return;

      const sessionKey = `${client.userId}:${data.execId}`;
      const activeSession = this.activeExecSessions.get(sessionKey);

      if (activeSession) {
        try {
          const stream = activeSession.stream as any;
          if (stream && typeof stream.destroy === 'function') {
            stream.destroy();
          } else if (stream && typeof stream.end === 'function') {
            stream.end();
          }
        } catch (error) {
          this.logger.warn(`Error stopping exec session: ${error.message}`);
        }
        this.activeExecSessions.delete(sessionKey);
      }

      client.leave(`docker:exec:${data.execId}`);
      client.emit('docker:exec:stopped', { execId: data.execId });

    } catch (error) {
      this.logger.error(`Docker exec stop error:`, error);
    }
  }

  // ============================
  // UTILITY METHODS
  // ============================

  private calculateCpuUsage(stats: any): number {
    const cpuDelta = stats.cpu_stats?.cpu_usage?.total_usage -
                     (stats.precpu_stats?.cpu_usage?.total_usage || 0);
    const systemDelta = stats.cpu_stats?.system_cpu_usage -
                        (stats.precpu_stats?.system_cpu_usage || 0);
    const cpuCount = stats.cpu_stats?.online_cpus || 1;

    if (systemDelta > 0 && cpuDelta > 0) {
      return (cpuDelta / systemDelta) * cpuCount * 100;
    }
    return 0;
  }

  private calculateMemoryUsage(stats: any): { used: number; available: number; percentage: number } {
    const used = stats.memory_stats?.usage || 0;
    const available = stats.memory_stats?.limit || 0;
    const percentage = available > 0 ? (used / available) * 100 : 0;

    return { used, available, percentage };
  }

  private calculateNetworkIO(stats: any): { rx: number; tx: number } {
    let rxBytes = 0;
    let txBytes = 0;

    if (stats.networks) {
      for (const network of Object.values(stats.networks) as any[]) {
        rxBytes += network.rx_bytes || 0;
        txBytes += network.tx_bytes || 0;
      }
    }

    return { rx: rxBytes, tx: txBytes };
  }

  private calculateBlockIO(stats: any): { read: number; write: number } {
    let readBytes = 0;
    let writeBytes = 0;

    if (stats.blkio_stats?.io_service_bytes_recursive) {
      for (const item of stats.blkio_stats.io_service_bytes_recursive) {
        if (item.op === 'Read') readBytes += item.value;
        if (item.op === 'Write') writeBytes += item.value;
      }
    }

    return { read: readBytes, write: writeBytes };
  }

  private cleanupInactiveStreams() {
    const now = new Date();
    const timeout = 30 * 60 * 1000; // 30 minutes

    for (const [key, stream] of this.activeLogStreams) {
      const timeSinceActivity = now.getTime() - stream.lastActivity.getTime();
      if (timeSinceActivity > timeout) {
        this.logger.log(`Cleaning up inactive log stream: ${key}`);
        try {
          const streamObj = stream.stream as any;
          if (streamObj && typeof streamObj.destroy === 'function') {
            streamObj.destroy();
          } else if (streamObj && typeof streamObj.end === 'function') {
            streamObj.end();
          }
        } catch (error) {
          this.logger.warn(`Error cleaning up log stream: ${error.message}`);
        }
        this.activeLogStreams.delete(key);
      }
    }

    for (const [key, stream] of this.activeStatsStreams) {
      const timeSinceActivity = now.getTime() - stream.lastActivity.getTime();
      if (timeSinceActivity > timeout) {
        this.logger.log(`Cleaning up inactive stats stream: ${key}`);
        try {
          const streamObj = stream.stream as any;
          if (streamObj && typeof streamObj.destroy === 'function') {
            streamObj.destroy();
          } else if (streamObj && typeof streamObj.end === 'function') {
            streamObj.end();
          }
        } catch (error) {
          this.logger.warn(`Error cleaning up stats stream: ${error.message}`);
        }
        this.activeStatsStreams.delete(key);
      }
    }

    for (const [key, session] of this.activeExecSessions) {
      const timeSinceActivity = now.getTime() - session.lastActivity.getTime();
      if (timeSinceActivity > timeout) {
        this.logger.log(`Cleaning up inactive exec session: ${key}`);
        try {
          const streamObj = session.stream as any;
          if (streamObj && typeof streamObj.destroy === 'function') {
            streamObj.destroy();
          } else if (streamObj && typeof streamObj.end === 'function') {
            streamObj.end();
          }
        } catch (error) {
          this.logger.warn(`Error cleaning up exec session: ${error.message}`);
        }
        this.activeExecSessions.delete(key);
      }
    }
  }

  getActiveStreams() {
    return {
      logs: this.activeLogStreams.size,
      stats: this.activeStatsStreams.size,
      exec: this.activeExecSessions.size
    };
  }

  emitToContainer(containerId: string, event: string, data: any) {
    if (this.server) {
      this.server.to(`docker:logs:${containerId}`).emit(event, data);
      this.server.to(`docker:stats:${containerId}`).emit(event, data);
    }
  }
}