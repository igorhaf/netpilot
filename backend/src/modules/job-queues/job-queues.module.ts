import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { JobQueue } from '../../entities/job-queue.entity';
import { JobExecution } from '../../entities/job-execution.entity';
import { JobSchedule } from '../../entities/job-schedule.entity';
import { JobQueuesService } from './job-queues.service';
import { JobExecutionsService } from './job-executions.service';
import { JobSchedulerService } from './job-scheduler.service';
import {
  JobQueuesController,
  JobExecutionsController,
  JobSchedulesController,
} from './job-queues.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobQueue, JobExecution, JobSchedule]),
    ScheduleModule.forRoot(),
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
  ],
  exports: [
    JobQueuesService,
    JobExecutionsService,
    JobSchedulerService,
  ],
})
export class JobQueuesModule {}