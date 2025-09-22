import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JobQueue } from '../../entities/job-queue.entity';
import { JobExecution, ExecutionStatus, TriggerType } from '../../entities/job-execution.entity';
import { JobSchedule, ScheduleType } from '../../entities/job-schedule.entity';
import { JobExecutionsService } from './job-executions.service';
import * as cronParser from 'cron-parser';

@Injectable()
export class JobSchedulerService {
  private readonly logger = new Logger(JobSchedulerService.name);

  constructor(
    @InjectRepository(JobQueue)
    private jobQueueRepository: Repository<JobQueue>,
    @InjectRepository(JobExecution)
    private jobExecutionRepository: Repository<JobExecution>,
    @InjectRepository(JobSchedule)
    private jobScheduleRepository: Repository<JobSchedule>,
    private jobExecutionsService: JobExecutionsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledJobs(): Promise<void> {
    this.logger.debug('Verificando jobs agendados...');

    try {
      // Buscar jobs ativos com expressão cron
      const activeJobs = await this.jobQueueRepository.find({
        where: { isActive: true },
      });

      for (const job of activeJobs) {
        if (job.cronExpression) {
          await this.checkAndExecuteJob(job);
        }
      }

      // Processar agendamentos específicos
      await this.processJobSchedules();

    } catch (error) {
      this.logger.error('Erro ao processar jobs agendados:', error);
    }
  }

  private async checkAndExecuteJob(job: JobQueue): Promise<void> {
    try {
      // Verificar se é hora de executar
      if (!this.shouldExecuteNow(job.cronExpression)) {
        return;
      }

      // Verificar se já existe execução em andamento
      const runningExecution = await this.jobExecutionRepository.findOne({
        where: {
          jobQueue: { id: job.id },
          status: ExecutionStatus.RUNNING,
        },
      });

      if (runningExecution) {
        this.logger.warn(`Job ${job.name} já está em execução`);
        return;
      }

      // Executar job
      this.logger.log(`Executando job agendado: ${job.name}`);
      await this.jobExecutionsService.executeJob(
        job.id,
        { triggerType: TriggerType.SCHEDULED }
      );

    } catch (error) {
      this.logger.error(`Erro ao executar job ${job.name}:`, error);
    }
  }

  private shouldExecuteNow(cronExpression: string): boolean {
    try {
      const interval = cronParser.parseExpression(cronExpression);
      const nextExecution = interval.next().toDate();
      const now = new Date();

      // Verificar se está dentro da janela de 1 minuto
      const timeDiff = Math.abs(nextExecution.getTime() - now.getTime());
      return timeDiff < 60000; // 60 segundos

    } catch (error) {
      this.logger.error(`Erro ao validar cron: ${cronExpression}`, error);
      return false;
    }
  }

  private async processJobSchedules(): Promise<void> {
    const now = new Date();

    // Buscar agendamentos ativos que devem ser executados
    const schedules = await this.jobScheduleRepository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.jobQueue', 'jobQueue')
      .where('schedule.isActive = :isActive', { isActive: true })
      .andWhere('schedule.nextExecution <= :now', { now })
      .andWhere('jobQueue.isActive = :jobActive', { jobActive: true })
      .getMany();

    for (const schedule of schedules) {
      await this.executeScheduledJob(schedule);
    }
  }

  private async executeScheduledJob(schedule: JobSchedule): Promise<void> {
    try {
      this.logger.log(`Executando job agendado: ${schedule.jobQueue.name}`);

      await this.jobExecutionsService.executeJob(
        schedule.jobQueue.id,
        { triggerType: TriggerType.SCHEDULED }
      );

      // Atualizar próxima execução
      await this.updateNextExecution(schedule);

    } catch (error) {
      this.logger.error(`Erro ao executar job agendado ${schedule.jobQueue.name}:`, error);
    }
  }

  private async updateNextExecution(schedule: JobSchedule): Promise<void> {
    schedule.lastExecution = new Date();

    switch (schedule.scheduleType) {
      case ScheduleType.CRON:
        if (schedule.cronExpression) {
          try {
            const interval = cronParser.parseExpression(schedule.cronExpression);
            schedule.nextExecution = interval.next().toDate();
          } catch (error) {
            this.logger.error(`Erro ao calcular próxima execução para cron: ${schedule.cronExpression}`, error);
            schedule.isActive = false;
          }
        }
        break;

      case ScheduleType.INTERVAL:
        if (schedule.intervalMinutes) {
          schedule.nextExecution = new Date(Date.now() + schedule.intervalMinutes * 60 * 1000);
        }
        break;

      case ScheduleType.SPECIFIC_DATES:
        if (schedule.specificDates && schedule.specificDates.length > 0) {
          const now = new Date();
          const nextDate = schedule.specificDates.find(date => new Date(date) > now);

          if (nextDate) {
            schedule.nextExecution = new Date(nextDate);
          } else {
            schedule.isActive = false; // Não há mais datas futuras
          }
        }
        break;

      case ScheduleType.ONCE:
        schedule.isActive = false; // Execução única
        break;
    }

    // Verificar se ainda está dentro do período ativo
    if (schedule.endDate && schedule.nextExecution > schedule.endDate) {
      schedule.isActive = false;
    }

    await this.jobScheduleRepository.save(schedule);
  }

  async createSchedule(jobQueueId: string, scheduleData: Partial<JobSchedule>): Promise<JobSchedule> {
    const jobQueue = await this.jobQueueRepository.findOne({
      where: { id: jobQueueId },
    });

    if (!jobQueue) {
      throw new Error('Job não encontrado');
    }

    const schedule = this.jobScheduleRepository.create({
      ...scheduleData,
      jobQueue,
    });

    // Calcular primeira execução
    await this.calculateInitialExecution(schedule);

    return this.jobScheduleRepository.save(schedule);
  }

  private async calculateInitialExecution(schedule: JobSchedule): Promise<void> {
    const now = new Date();

    switch (schedule.scheduleType) {
      case ScheduleType.CRON:
        if (schedule.cronExpression) {
          try {
            const interval = cronParser.parseExpression(schedule.cronExpression);
            schedule.nextExecution = interval.next().toDate();
          } catch (error) {
            throw new Error(`Expressão cron inválida: ${schedule.cronExpression}`);
          }
        }
        break;

      case ScheduleType.INTERVAL:
        if (schedule.intervalMinutes) {
          schedule.nextExecution = new Date(now.getTime() + schedule.intervalMinutes * 60 * 1000);
        }
        break;

      case ScheduleType.SPECIFIC_DATES:
        if (schedule.specificDates && schedule.specificDates.length > 0) {
          const nextDate = schedule.specificDates.find(date => new Date(date) > now);
          if (nextDate) {
            schedule.nextExecution = new Date(nextDate);
          }
        }
        break;

      case ScheduleType.ONCE:
        if (schedule.startDate) {
          schedule.nextExecution = schedule.startDate;
        } else {
          schedule.nextExecution = now;
        }
        break;
    }

    // Verificar se a execução está dentro do período ativo
    if (schedule.startDate && schedule.nextExecution < schedule.startDate) {
      schedule.nextExecution = schedule.startDate;
    }

    if (schedule.endDate && schedule.nextExecution > schedule.endDate) {
      schedule.isActive = false;
    }
  }

  async getActiveSchedules(): Promise<JobSchedule[]> {
    return this.jobScheduleRepository.find({
      where: { isActive: true },
      relations: ['jobQueue'],
      order: { nextExecution: 'ASC' },
    });
  }

  async pauseSchedule(scheduleId: string): Promise<JobSchedule> {
    const schedule = await this.jobScheduleRepository.findOne({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new Error('Agendamento não encontrado');
    }

    schedule.isActive = false;
    return this.jobScheduleRepository.save(schedule);
  }

  async resumeSchedule(scheduleId: string): Promise<JobSchedule> {
    const schedule = await this.jobScheduleRepository.findOne({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new Error('Agendamento não encontrado');
    }

    schedule.isActive = true;
    await this.calculateInitialExecution(schedule);
    return this.jobScheduleRepository.save(schedule);
  }

  async deleteSchedule(scheduleId: string): Promise<void> {
    const schedule = await this.jobScheduleRepository.findOne({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new Error('Agendamento não encontrado');
    }

    await this.jobScheduleRepository.remove(schedule);
  }
}