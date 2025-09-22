import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebSocketGateway as WSGateway } from './websocket.gateway';
import { WebSocketService } from './services/websocket.service';
import { SshWebSocketHandler } from './handlers/ssh-websocket.handler';
import { DockerWebSocketHandler } from './handlers/docker-websocket.handler';

// Import SSH entities
import { SshSession } from '../../entities/ssh-session.entity';
import { ConsoleLog } from '../../entities/console-log.entity';

// Import Docker entities
// import { DockerJob } from '../docker/entities/docker-job.entity'; // Temporarily disabled

// Import modules
// import { DockerModule } from '../docker/docker.module'; // Temporarily disabled

// Import services
import { ConsoleService } from '../console/console.service';
import { WebSocketRateLimitGuard } from './guards/websocket-rate-limit.guard';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([SshSession, ConsoleLog]), // DockerJob temporarily disabled
    // DockerModule // Temporarily disabled
  ],
  providers: [
    WSGateway,
    WebSocketService,
    SshWebSocketHandler,
    // DockerWebSocketHandler, // Temporarily disabled due to DOCKER_CONFIG dependency
    WebSocketRateLimitGuard,
    ConsoleService
  ],
  exports: [WebSocketService, WSGateway, SshWebSocketHandler] // DockerWebSocketHandler temporarily disabled
})
export class WebSocketModule {}