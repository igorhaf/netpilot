import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JobQueuesService } from './job-queues.service';
import { JobExecutionsService } from './job-executions.service';
import { JobSchedulerService } from './job-scheduler.service';
import { CreateJobQueueDto } from './dto/create-job-queue.dto';
import { UpdateJobQueueDto } from './dto/update-job-queue.dto';
import { ExecuteJobDto } from './dto/execute-job.dto';
import { JobExecutionQueryDto } from './dto/job-execution-query.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('job-queues')
@UseGuards(JwtAuthGuard)
export class JobQueuesController {
  constructor(
    private readonly jobQueuesService: JobQueuesService,
    private readonly jobExecutionsService: JobExecutionsService,
    private readonly jobSchedulerService: JobSchedulerService,
  ) {}

  @Post()
  create(@Body() createJobQueueDto: CreateJobQueueDto, @Request() req) {
    return this.jobQueuesService.create(createJobQueueDto, req.user?.id);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    const active = isActive ? isActive === 'true' : undefined;
    return this.jobQueuesService.findAll(search, active);
  }

  @Get('statistics')
  getStatistics() {
    return this.jobQueuesService.getStatistics();
  }

  @Get('upcoming')
  getUpcomingExecutions(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.jobQueuesService.getUpcomingExecutions(limitNum);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobQueuesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateJobQueueDto: UpdateJobQueueDto) {
    return this.jobQueuesService.update(id, updateJobQueueDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jobQueuesService.remove(id);
  }

  @Post(':id/execute')
  executeJob(
    @Param('id') id: string,
    @Body() executeJobDto: ExecuteJobDto,
    @Request() req,
  ) {
    return this.jobExecutionsService.executeJob(id, executeJobDto, req.user?.id);
  }

  @Post(':id/toggle')
  toggleActive(@Param('id') id: string) {
    return this.jobQueuesService.toggleActive(id);
  }

  @Post(':id/validate-cron')
  validateCron(@Param('id') id: string, @Body('cronExpression') cronExpression: string) {
    return this.jobQueuesService.validateCronExpression(cronExpression);
  }
}

@Controller('job-executions')
@UseGuards(JwtAuthGuard)
export class JobExecutionsController {
  constructor(
    private readonly jobExecutionsService: JobExecutionsService,
  ) {}

  @Get()
  findAll(@Query() queryDto: JobExecutionQueryDto) {
    return this.jobExecutionsService.findAll(queryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobExecutionsService.findOne(id);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.jobExecutionsService.cancel(id);
  }

  @Post(':id/retry')
  retry(@Param('id') id: string) {
    return this.jobExecutionsService.retry(id);
  }

  @Get(':id/logs')
  getLogs(@Param('id') id: string) {
    return this.jobExecutionsService.findOne(id).then(execution => ({
      outputLog: execution.outputLog,
      errorLog: execution.errorLog,
    }));
  }

  @Get('redis/stats')
  getRedisStats() {
    return this.jobExecutionsService.getRedisStats();
  }

  @Get('redis/health')
  getRedisHealth() {
    return this.jobExecutionsService.getRedisHealth();
  }
}

@Controller('job-schedules')
@UseGuards(JwtAuthGuard)
export class JobSchedulesController {
  constructor(
    private readonly jobSchedulerService: JobSchedulerService,
  ) {}

  @Get()
  getActiveSchedules() {
    return this.jobSchedulerService.getActiveSchedules();
  }

  @Post(':jobQueueId')
  createSchedule(@Param('jobQueueId') jobQueueId: string, @Body() scheduleData: any) {
    return this.jobSchedulerService.createSchedule(jobQueueId, scheduleData);
  }

  @Post(':id/pause')
  pauseSchedule(@Param('id') id: string) {
    return this.jobSchedulerService.pauseSchedule(id);
  }

  @Post(':id/resume')
  resumeSchedule(@Param('id') id: string) {
    return this.jobSchedulerService.resumeSchedule(id);
  }

  @Delete(':id')
  deleteSchedule(@Param('id') id: string) {
    return this.jobSchedulerService.deleteSchedule(id);
  }
}