import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Client } from 'ssh2';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SshSession } from '../../../entities/ssh-session.entity';
import { ConsoleLog } from '../../../entities/console-log.entity';
import { ConsoleService } from '../../console/console.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

interface ActiveSshConnection {
  client: Client;
  sessionId: string;
  userId: string;
  stream?: any;
  connectedAt: Date;
  lastActivity: Date;
}

@Injectable()
export class SshWebSocketHandler {
  private readonly logger = new Logger(SshWebSocketHandler.name);
  private server: Server;
  private activeConnections: Map<string, ActiveSshConnection> = new Map();

  constructor(
    @InjectRepository(SshSession)
    private readonly sshSessionRepository: Repository<SshSession>,
    @InjectRepository(ConsoleLog)
    private readonly consoleLogRepository: Repository<ConsoleLog>,
    private readonly consoleService: ConsoleService
  ) {
    setInterval(() => this.cleanupInactiveConnections(), 5 * 60 * 1000);
  }

  setServer(server: Server) {
    this.server = server;
  }

  async handleConnect(client: AuthenticatedSocket, data: { sessionId: string }) {
    try {
      if (!client.userId) {
        client.emit('ssh:error', { message: 'Not authenticated' });
        return;
      }

      const session = await this.sshSessionRepository.findOne({
        where: { id: data.sessionId, userId: client.userId }
      });

      if (!session) {
        client.emit('ssh:error', {
          sessionId: data.sessionId,
          message: 'Session not found'
        });
        return;
      }

      const connectionKey = `${client.userId}:${data.sessionId}`;

      if (this.activeConnections.has(connectionKey)) {
        const existing = this.activeConnections.get(connectionKey);
        existing.client.end();
        this.activeConnections.delete(connectionKey);
      }

      const sshClient = new Client();

      const connection: ActiveSshConnection = {
        client: sshClient,
        sessionId: data.sessionId,
        userId: client.userId,
        connectedAt: new Date(),
        lastActivity: new Date()
      };

      sshClient.on('ready', () => {
        this.logger.log(`SSH connection established for session ${data.sessionId}`);

        sshClient.shell((err, stream) => {
          if (err) {
            this.logger.error(`Failed to start shell for session ${data.sessionId}:`, err);
            client.emit('ssh:error', {
              sessionId: data.sessionId,
              message: 'Failed to start shell'
            });
            return;
          }

          connection.stream = stream;
          this.activeConnections.set(connectionKey, connection);

          client.join(`ssh:${data.sessionId}`);
          client.emit('ssh:connected', { sessionId: data.sessionId });

          stream.on('data', (chunk: Buffer) => {
            connection.lastActivity = new Date();
            client.emit('ssh:data', {
              sessionId: data.sessionId,
              data: chunk.toString()
            });
          });

          stream.on('close', () => {
            this.logger.log(`SSH stream closed for session ${data.sessionId}`);
            client.emit('ssh:disconnected', { sessionId: data.sessionId });
            this.activeConnections.delete(connectionKey);
          });

          stream.stderr.on('data', (chunk: Buffer) => {
            connection.lastActivity = new Date();
            client.emit('ssh:data', {
              sessionId: data.sessionId,
              data: chunk.toString(),
              stderr: true
            });
          });
        });
      });

      sshClient.on('error', (err) => {
        this.logger.error(`SSH connection error for session ${data.sessionId}:`, err);
        client.emit('ssh:error', {
          sessionId: data.sessionId,
          message: err.message
        });
        this.activeConnections.delete(connectionKey);
      });

      sshClient.on('close', () => {
        this.logger.log(`SSH connection closed for session ${data.sessionId}`);
        client.emit('ssh:disconnected', { sessionId: data.sessionId });
        this.activeConnections.delete(connectionKey);
      });

      const connectConfig: any = {
        host: session.hostname,
        port: session.port,
        username: session.username
      };

      if (session.password) {
        // For now, assume password is already encrypted/stored securely
        // TODO: Implement proper decryption when ConsoleService decrypt method is available
        connectConfig.password = session.password;
      } else if (session.privateKey) {
        // TODO: Implement proper decryption when ConsoleService decrypt method is available
        connectConfig.privateKey = session.privateKey;
        if (session.passphrase) {
          connectConfig.passphrase = session.passphrase;
        }
      }

      sshClient.connect(connectConfig);

    } catch (error) {
      this.logger.error(`SSH connect error:`, error);
      client.emit('ssh:error', {
        sessionId: data.sessionId,
        message: error.message
      });
    }
  }

  async handleDisconnect(client: AuthenticatedSocket, data: { sessionId: string }) {
    try {
      if (!client.userId) return;

      const connectionKey = `${client.userId}:${data.sessionId}`;
      const connection = this.activeConnections.get(connectionKey);

      if (connection) {
        connection.client.end();
        this.activeConnections.delete(connectionKey);
      }

      client.leave(`ssh:${data.sessionId}`);
      client.emit('ssh:disconnected', { sessionId: data.sessionId });

    } catch (error) {
      this.logger.error(`SSH disconnect error:`, error);
    }
  }

  async handleCommand(client: AuthenticatedSocket, data: { sessionId: string; command: string; requestId?: string }) {
    try {
      if (!client.userId) {
        client.emit('ssh:error', { message: 'Not authenticated' });
        return;
      }

      const connectionKey = `${client.userId}:${data.sessionId}`;
      const connection = this.activeConnections.get(connectionKey);

      if (!connection || !connection.stream) {
        client.emit('ssh:error', {
          sessionId: data.sessionId,
          message: 'No active SSH connection'
        });
        return;
      }

      const startTime = Date.now();
      connection.lastActivity = new Date();

      connection.stream.write(data.command + '\n');

      client.emit('ssh:command:sent', {
        sessionId: data.sessionId,
        requestId: data.requestId,
        command: data.command,
        timestamp: new Date()
      });

      const consoleLog = this.consoleLogRepository.create({
        sessionId: data.sessionId,
        userId: client.userId,
        command: data.command,
        executedAt: new Date(),
        executionTime: Date.now() - startTime,
        status: 'completed',
        workingDirectory: '~', // Default working directory
        exitCode: 0,
        output: '',
        errorOutput: ''
      });

      await this.consoleLogRepository.save(consoleLog);

    } catch (error) {
      this.logger.error(`SSH command error:`, error);
      client.emit('ssh:error', {
        sessionId: data.sessionId,
        message: error.message
      });
    }
  }

  handleResize(client: AuthenticatedSocket, data: { sessionId: string; cols: number; rows: number }) {
    try {
      if (!client.userId) return;

      const connectionKey = `${client.userId}:${data.sessionId}`;
      const connection = this.activeConnections.get(connectionKey);

      if (connection && connection.stream) {
        connection.stream.setWindow(data.rows, data.cols);
        connection.lastActivity = new Date();

        client.to(`ssh:${data.sessionId}`).emit('ssh:resize', {
          sessionId: data.sessionId,
          cols: data.cols,
          rows: data.rows
        });
      }

    } catch (error) {
      this.logger.error(`SSH resize error:`, error);
    }
  }

  async handleJoin(client: AuthenticatedSocket, data: { sessionId: string }) {
    try {
      if (!client.userId) return;

      const session = await this.sshSessionRepository.findOne({
        where: { id: data.sessionId, userId: client.userId }
      });

      if (!session) {
        client.emit('ssh:error', {
          sessionId: data.sessionId,
          message: 'Session not found'
        });
        return;
      }

      client.join(`ssh:${data.sessionId}`);
      client.emit('ssh:joined', { sessionId: data.sessionId });

      const connectionKey = `${client.userId}:${data.sessionId}`;
      const isConnected = this.activeConnections.has(connectionKey);

      client.emit('ssh:status', {
        sessionId: data.sessionId,
        status: isConnected ? 'connected' : 'disconnected'
      });

    } catch (error) {
      this.logger.error(`SSH join error:`, error);
      client.emit('ssh:error', {
        sessionId: data.sessionId,
        message: error.message
      });
    }
  }

  handleLeave(client: AuthenticatedSocket, data: { sessionId: string }) {
    client.leave(`ssh:${data.sessionId}`);
    client.emit('ssh:left', { sessionId: data.sessionId });
  }

  private cleanupInactiveConnections() {
    const now = new Date();
    const timeout = 30 * 60 * 1000; // 30 minutes

    for (const [key, connection] of this.activeConnections) {
      const timeSinceActivity = now.getTime() - connection.lastActivity.getTime();

      if (timeSinceActivity > timeout) {
        this.logger.log(`Cleaning up inactive SSH connection: ${key}`);
        connection.client.end();
        this.activeConnections.delete(key);
      }
    }
  }

  getActiveConnections(): Map<string, ActiveSshConnection> {
    return this.activeConnections;
  }

  emitToSession(sessionId: string, event: string, data: any) {
    if (this.server) {
      this.server.to(`ssh:${sessionId}`).emit(event, data);
    }
  }
}