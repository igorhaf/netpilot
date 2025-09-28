import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { JobQueue } from '../../entities/job-queue.entity';
import { JobExecution } from '../../entities/job-execution.entity';
import { JobSchedule } from '../../entities/job-schedule.entity';
import { JobQueuesService } from './job-queues.service';
import { JobExecutionsService } from './job-executions.service';
import { JobSchedulerService } from './job-scheduler.service';
import { JobQueuesGateway } from './job-queues.gateway';
import { RedisQueueService } from '../redis/redis-queue.service';
import {
  JobQueuesController,
  JobExecutionsController,
  JobSchedulesController,
} from './job-queues.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobQueue, JobExecution, JobSchedule]),
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: 'job-processor',
    }),
  ],
  controllers: [
    JobQueuesController,
    JobExecutionsController,
    JobSchedulesController,
  ],
  providers: [
    JobQueuesService,
    JobExecutionsService,
    JobSchedulerService,
    JobQueuesGateway,
    RedisQueueService,
  ],
  exports: [
    JobQueuesService,
    JobExecutionsService,
    JobSchedulerService,
  ],
})
export class JobQueuesModule {}