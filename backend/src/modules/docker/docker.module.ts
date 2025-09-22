import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

// Entities
import { DockerJob } from './entities/docker-job.entity';
import { DockerBackup } from './entities/docker-backup.entity';
import { DockerEvent } from './entities/docker-event.entity';
import { DockerQuota } from './entities/docker-quota.entity';

// Controllers
import { ContainersController } from './controllers/containers.controller';
import { VolumesController } from './controllers/volumes.controller';
import { NetworksController } from './controllers/networks.controller';
import { ImagesController } from './controllers/images.controller';
import { JobsController } from './controllers/jobs.controller';
import { TestController } from './controllers/test.controller';

// Services
import { DockerService } from './services/docker.service';
import { ContainersService } from './services/containers.service';
import { VolumesService } from './services/volumes.service';
import { NetworksService } from './services/networks.service';
import { ImagesService } from './services/images.service';
import { JobsService } from './services/jobs.service';
import { DockerEventsService } from './services/docker-events.service';
import { DockerMetricsService } from './services/docker-metrics.service';

// Guards
import { DockerQuotaGuard } from './guards/docker-quota.guard';
import { DockerRbacGuard } from './guards/docker-rbac.guard';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      DockerJob,
      DockerBackup,
      DockerEvent,
      DockerQuota
    ]),
    BullModule.registerQueue({
      name: 'docker',
    }),
  ],
  controllers: [
    TestController,
    ContainersController,
    VolumesController,
    NetworksController,
    ImagesController,
    JobsController,
  ],
  providers: [
    // Core services
    {
      provide: 'DOCKER_CONFIG',
      useValue: {
        socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock',
        host: process.env.DOCKER_HOST,
        port: process.env.DOCKER_PORT ? parseInt(process.env.DOCKER_PORT) : undefined,
      },
    },
    DockerService,
    ContainersService,
    VolumesService,
    NetworksService,
    ImagesService,
    JobsService,
    DockerEventsService,
    DockerMetricsService,

    // Guards
    DockerQuotaGuard,
    DockerRbacGuard,

  ],
  exports: [
    DockerService,
    DockerMetricsService,
  ],
})
export class DockerModule {}