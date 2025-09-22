import {
  WebSocketGateway as WSGatewayDecorator,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WebSocketService } from './services/websocket.service';
import { SshWebSocketHandler } from './handlers/ssh-websocket.handler';
// import { DockerWebSocketHandler } from './handlers/docker-websocket.handler'; // Temporarily disabled
import {
  WebSocketRateLimitGuard,
  LightRateLimit,
  ModerateRateLimit,
  CommandRateLimit,
  ConnectionRateLimit
} from './guards/websocket-rate-limit.guard';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

@WSGatewayDecorator({
  cors: {
    origin: (origin, callback) => {
      // Allow requests from environment-configured origins
      const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'https://netpilot.meadadigital.com',
        'https://netpilot.meadadigital.com:3000',
        'http://netpilot.meadadigital.com',
        'http://netpilot.meadadigital.com:3000',
        'http://localhost:3000',
        'http://meadadigital.com:3000'
      ];

      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`WebSocket CORS: Blocked origin ${origin}`);
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
  },
  allowEIO3: true
})
export class WebSocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly webSocketService: WebSocketService,
    private readonly sshHandler: SshWebSocketHandler,
    // private readonly dockerHandler: DockerWebSocketHandler // Temporarily disabled
  ) {}

  afterInit(server: Server) {
    this.logger.log('Unified WebSocket Gateway initialized');
    this.webSocketService.setServer(server);
    this.sshHandler.setServer(server);
    // this.dockerHandler.setServer(server); // Temporarily disabled
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extrair token JWT
      const token = this.extractToken(client);

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      // Validar token e obter usuário
      const userId = await this.validateTokenAndGetUserId(token);

      if (!userId) {
        this.logger.warn(`Client ${client.id} provided invalid token`);
        client.disconnect();
        return;
      }

      client.userId = userId;

      // Registrar conexão
      this.webSocketService.addClientConnection(userId, client.id);

      this.logger.log(`Client ${client.id} connected for user ${userId}`);

      // Enviar status inicial
      client.emit('connection:established', {
        clientId: client.id,
        userId,
        timestamp: new Date()
      });

    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.webSocketService.removeClientConnection(client.userId, client.id);
      this.logger.log(`Client ${client.id} disconnected for user ${client.userId}`);
    }
  }

  // ============================
  // SSH HANDLERS
  // ============================

  @UseGuards(WebSocketRateLimitGuard)
  @ConnectionRateLimit()
  @SubscribeMessage('ssh:connect')
  async handleSshConnect(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { sessionId: string }
  ) {
    return this.sshHandler.handleConnect(client, data);
  }

  @SubscribeMessage('ssh:disconnect')
  async handleSshDisconnect(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { sessionId: string }
  ) {
    return this.sshHandler.handleDisconnect(client, data);
  }

  @UseGuards(WebSocketRateLimitGuard)
  @CommandRateLimit()
  @SubscribeMessage('ssh:command')
  async handleSshCommand(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { sessionId: string; command: string; requestId?: string }
  ) {
    return this.sshHandler.handleCommand(client, data);
  }

  @SubscribeMessage('ssh:resize')
  handleSshResize(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { sessionId: string; cols: number; rows: number }
  ) {
    return this.sshHandler.handleResize(client, data);
  }

  @SubscribeMessage('ssh:join')
  async handleSshJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { sessionId: string }
  ) {
    return this.sshHandler.handleJoin(client, data);
  }

  @SubscribeMessage('ssh:leave')
  handleSshLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { sessionId: string }
  ) {
    return this.sshHandler.handleLeave(client, data);
  }

  // ============================
  // DOCKER HANDLERS - TEMPORARILY DISABLED
  // ============================

  /*
  @UseGuards(WebSocketRateLimitGuard)
  @ModerateRateLimit()
  @SubscribeMessage('docker:logs:start')
  async handleDockerLogsStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { containerId: string; tail?: number; follow?: boolean }
  ) {
    return this.dockerHandler.handleLogsStart(client, data);
  }

  @SubscribeMessage('docker:logs:stop')
  async handleDockerLogsStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { containerId: string }
  ) {
    return this.dockerHandler.handleLogsStop(client, data);
  }

  @SubscribeMessage('docker:stats:start')
  async handleDockerStatsStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { containerId: string }
  ) {
    return this.dockerHandler.handleStatsStart(client, data);
  }

  @SubscribeMessage('docker:stats:stop')
  async handleDockerStatsStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { containerId: string }
  ) {
    return this.dockerHandler.handleStatsStop(client, data);
  }

  @UseGuards(WebSocketRateLimitGuard)
  @ConnectionRateLimit()
  @SubscribeMessage('docker:exec:start')
  async handleDockerExecStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      containerId: string;
      command: string[];
      interactive?: boolean;
      tty?: boolean;
      env?: string[];
    }
  ) {
    return this.dockerHandler.handleExecStart(client, data);
  }

  @SubscribeMessage('docker:exec:input')
  async handleDockerExecInput(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { execId: string; input: string }
  ) {
    return this.dockerHandler.handleExecInput(client, data);
  }

  @SubscribeMessage('docker:exec:resize')
  async handleDockerExecResize(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { execId: string; cols: number; rows: number }
  ) {
    return this.dockerHandler.handleExecResize(client, data);
  }

  @SubscribeMessage('docker:exec:stop')
  async handleDockerExecStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { execId: string }
  ) {
    return this.dockerHandler.handleExecStop(client, data);
  }
  */

  // ============================
  // GENERAL HANDLERS
  // ============================

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    client.emit('pong', { timestamp: new Date() });
  }

  @SubscribeMessage('join:room')
  handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: string }
  ) {
    client.join(data.room);
    client.emit('room:joined', { room: data.room });
  }

  @SubscribeMessage('leave:room')
  handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: string }
  ) {
    client.leave(data.room);
    client.emit('room:left', { room: data.room });
  }

  // ============================
  // PRIVATE METHODS
  // ============================

  private extractToken(client: AuthenticatedSocket): string | null {
    return (
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.replace('Bearer ', '') ||
      client.handshake.query?.token as string ||
      null
    );
  }

  private async validateTokenAndGetUserId(token: string): Promise<string | null> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET
      });
      return payload.sub || payload.userId;
    } catch (error) {
      this.logger.warn(`JWT validation failed: ${error.message}`);
      return null;
    }
  }
}