import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobQueue } from '../../entities/job-queue.entity';
import { JobExecution, ExecutionStatus } from '../../entities/job-execution.entity';
import { JobSchedule } from '../../entities/job-schedule.entity';
import { CreateJobQueueDto } from './dto/create-job-queue.dto';
import { UpdateJobQueueDto } from './dto/update-job-queue.dto';
import { CronValidationResult, JobStatistics } from './types/job-queue.types';
import * as cronParser from 'cron-parser';

@Injectable()
export class JobQueuesService {
  constructor(
    @InjectRepository(JobQueue)
    private jobQueueRepository: Repository<JobQueue>,
    @InjectRepository(JobExecution)
    private jobExecutionRepository: Repository<JobExecution>,
    @InjectRepository(JobSchedule)
    private jobScheduleRepository: Repository<JobSchedule>,
  ) {}

  async create(createJobQueueDto: CreateJobQueueDto, userId?: string): Promise<JobQueue> {
    // Verificar se já existe um job com esse nome
    const existingJob = await this.jobQueueRepository.findOne({
      where: { name: createJobQueueDto.name },
    });

    if (existingJob) {
      throw new ConflictException('Job com este nome já existe');
    }

    // Validar expressão cron se fornecida
    if (createJobQueueDto.cronExpression) {
      const cronValidation = this.validateCronExpression(createJobQueueDto.cronExpression);
      if (!cronValidation.isValid) {
        throw new BadRequestException(`Expressão cron inválida: ${cronValidation.error}`);
      }
    }

    const jobQueue = this.jobQueueRepository.create({
      ...createJobQueueDto,
      createdBy: userId ? { id: userId } as any : null,
    });

    return this.jobQueueRepository.save(jobQueue);
  }

  async findAll(search?: string, isActive?: boolean): Promise<JobQueue[]> {
    const query = this.jobQueueRepository.createQueryBuilder('jobQueue')
      .leftJoinAndSelect('jobQueue.executions', 'executions')
      .leftJoinAndSelect('jobQueue.schedules', 'schedules')
      .leftJoinAndSelect('jobQueue.createdBy', 'createdBy');

    if (search) {
      query.where('jobQueue.name ILIKE :search OR jobQueue.description ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (isActive !== undefined) {
      query.andWhere('jobQueue.isActive = :isActive', { isActive });
    }

    return query.orderBy('jobQueue.priority', 'ASC')
      .addOrderBy('jobQueue.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<JobQueue> {
    const jobQueue = await this.jobQueueRepository.findOne({
      where: { id },
      relations: [
        'executions',
        'schedules',
        'createdBy',
        'executions.triggeredBy'
      ],
    });

    if (!jobQueue) {
      throw new NotFoundException('Job não encontrado');
    }

    return jobQueue;
  }

  async update(id: string, updateJobQueueDto: UpdateJobQueueDto): Promise<JobQueue> {
    const jobQueue = await this.findOne(id);

    // Verificar nome único se mudou
    if (updateJobQueueDto.name && updateJobQueueDto.name !== jobQueue.name) {
      const existingJob = await this.jobQueueRepository.findOne({
        where: { name: updateJobQueueDto.name },
      });

      if (existingJob) {
        throw new ConflictException('Job com este nome já existe');
      }
    }

    // Validar nova expressão cron se fornecida
    if (updateJobQueueDto.cronExpression) {
      const cronValidation = this.validateCronExpression(updateJobQueueDto.cronExpression);
      if (!cronValidation.isValid) {
        throw new BadRequestException(`Expressão cron inválida: ${cronValidation.error}`);
      }
    }

    Object.assign(jobQueue, updateJobQueueDto);
    return this.jobQueueRepository.save(jobQueue);
  }

  async remove(id: string): Promise<void> {
    const jobQueue = await this.findOne(id);

    // Cancelar execuções em andamento
    await this.jobExecutionRepository.update(
      {
        jobQueue: { id },
        status: ExecutionStatus.RUNNING
      },
      { status: ExecutionStatus.CANCELLED }
    );

    await this.jobQueueRepository.remove(jobQueue);
  }

  async toggleActive(id: string): Promise<JobQueue> {
    const jobQueue = await this.findOne(id);
    jobQueue.isActive = !jobQueue.isActive;
    return this.jobQueueRepository.save(jobQueue);
  }

  validateCronExpression(cronExpression: string): CronValidationResult {
    try {
      const interval = cronParser.parseExpression(cronExpression);
      const nextExecutions: Date[] = [];

      // Obter as próximas 5 execuções
      for (let i = 0; i < 5; i++) {
        nextExecutions.push(interval.next().toDate());
      }

      return {
        isValid: true,
        nextExecutions,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  async getStatistics(): Promise<JobStatistics> {
    const [
      totalJobs,
      activeJobs,
      completedExecutions,
      failedExecutions,
      avgExecutionTime
    ] = await Promise.all([
      this.jobQueueRepository.count(),
      this.jobQueueRepository.count({ where: { isActive: true } }),
      this.jobExecutionRepository.count({ where: { status: ExecutionStatus.COMPLETED } }),
      this.jobExecutionRepository.count({ where: { status: ExecutionStatus.FAILED } }),
      this.jobExecutionRepository
        .createQueryBuilder('execution')
        .select('AVG(execution."executionTimeMs")', 'avg')
        .where('execution.status = :status', { status: ExecutionStatus.COMPLETED })
        .getRawOne()
    ]);

    return {
      totalJobs,
      activeJobs,
      completedExecutions,
      failedExecutions,
      averageExecutionTime: Math.round(Number(avgExecutionTime?.avg) || 0),
      upcomingExecutions: 0, // TODO: Calcular execuções agendadas
    };
  }

  async getUpcomingExecutions(limit: number = 10): Promise<any[]> {
    const activeJobs = await this.jobQueueRepository.find({
      where: { isActive: true },
    });

    const upcomingExecutions = [];

    for (const job of activeJobs) {
      if (job.cronExpression) {
        try {
          const interval = cronParser.parseExpression(job.cronExpression);
          const nextExecution = interval.next().toDate();

          upcomingExecutions.push({
            jobQueue: job,
            nextExecution,
            cronExpression: job.cronExpression,
          });
        } catch (error) {
          // Ignorar jobs com cron inválido
        }
      }
    }

    return upcomingExecutions
      .sort((a, b) => a.nextExecution.getTime() - b.nextExecution.getTime())
      .slice(0, limit);
  }
}