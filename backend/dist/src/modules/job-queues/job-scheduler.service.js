"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var JobSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_1 = require("@nestjs/schedule");
const job_queue_entity_1 = require("../../entities/job-queue.entity");
const job_execution_entity_1 = require("../../entities/job-execution.entity");
const job_schedule_entity_1 = require("../../entities/job-schedule.entity");
const job_executions_service_1 = require("./job-executions.service");
const cronParser = require("cron-parser");
let JobSchedulerService = JobSchedulerService_1 = class JobSchedulerService {
    constructor(jobQueueRepository, jobExecutionRepository, jobScheduleRepository, jobExecutionsService) {
        this.jobQueueRepository = jobQueueRepository;
        this.jobExecutionRepository = jobExecutionRepository;
        this.jobScheduleRepository = jobScheduleRepository;
        this.jobExecutionsService = jobExecutionsService;
        this.logger = new common_1.Logger(JobSchedulerService_1.name);
    }
    async processScheduledJobs() {
        this.logger.debug('Verificando jobs agendados...');
        try {
            const activeJobs = await this.jobQueueRepository.find({
                where: { isActive: true },
            });
            for (const job of activeJobs) {
                if (job.cronExpression) {
                    await this.checkAndExecuteJob(job);
                }
            }
            await this.processJobSchedules();
        }
        catch (error) {
            this.logger.error('Erro ao processar jobs agendados:', error);
        }
    }
    async checkAndExecuteJob(job) {
        try {
            if (!this.shouldExecuteNow(job.cronExpression)) {
                return;
            }
            const runningExecution = await this.jobExecutionRepository.findOne({
                where: {
                    jobQueue: { id: job.id },
                    status: job_execution_entity_1.ExecutionStatus.RUNNING,
                },
            });
            if (runningExecution) {
                this.logger.warn(`Job ${job.name} já está em execução`);
                return;
            }
            this.logger.log(`Executando job agendado: ${job.name}`);
            await this.jobExecutionsService.executeJob(job.id, { triggerType: job_execution_entity_1.TriggerType.SCHEDULED });
        }
        catch (error) {
            this.logger.error(`Erro ao executar job ${job.name}:`, error);
        }
    }
    shouldExecuteNow(cronExpression) {
        try {
            const interval = cronParser.parseExpression(cronExpression);
            const nextExecution = interval.next().toDate();
            const now = new Date();
            const timeDiff = Math.abs(nextExecution.getTime() - now.getTime());
            return timeDiff < 60000;
        }
        catch (error) {
            this.logger.error(`Erro ao validar cron: ${cronExpression}`, error);
            return false;
        }
    }
    async processJobSchedules() {
        const now = new Date();
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
    async executeScheduledJob(schedule) {
        try {
            this.logger.log(`Executando job agendado: ${schedule.jobQueue.name}`);
            await this.jobExecutionsService.executeJob(schedule.jobQueue.id, { triggerType: job_execution_entity_1.TriggerType.SCHEDULED });
            await this.updateNextExecution(schedule);
        }
        catch (error) {
            this.logger.error(`Erro ao executar job agendado ${schedule.jobQueue.name}:`, error);
        }
    }
    async updateNextExecution(schedule) {
        schedule.lastExecution = new Date();
        switch (schedule.scheduleType) {
            case job_schedule_entity_1.ScheduleType.CRON:
                if (schedule.cronExpression) {
                    try {
                        const interval = cronParser.parseExpression(schedule.cronExpression);
                        schedule.nextExecution = interval.next().toDate();
                    }
                    catch (error) {
                        this.logger.error(`Erro ao calcular próxima execução para cron: ${schedule.cronExpression}`, error);
                        schedule.isActive = false;
                    }
                }
                break;
            case job_schedule_entity_1.ScheduleType.INTERVAL:
                if (schedule.intervalMinutes) {
                    schedule.nextExecution = new Date(Date.now() + schedule.intervalMinutes * 60 * 1000);
                }
                break;
            case job_schedule_entity_1.ScheduleType.SPECIFIC_DATES:
                if (schedule.specificDates && schedule.specificDates.length > 0) {
                    const now = new Date();
                    const nextDate = schedule.specificDates.find(date => new Date(date) > now);
                    if (nextDate) {
                        schedule.nextExecution = new Date(nextDate);
                    }
                    else {
                        schedule.isActive = false;
                    }
                }
                break;
            case job_schedule_entity_1.ScheduleType.ONCE:
                schedule.isActive = false;
                break;
        }
        if (schedule.endDate && schedule.nextExecution > schedule.endDate) {
            schedule.isActive = false;
        }
        await this.jobScheduleRepository.save(schedule);
    }
    async createSchedule(jobQueueId, scheduleData) {
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
        await this.calculateInitialExecution(schedule);
        return this.jobScheduleRepository.save(schedule);
    }
    async calculateInitialExecution(schedule) {
        const now = new Date();
        switch (schedule.scheduleType) {
            case job_schedule_entity_1.ScheduleType.CRON:
                if (schedule.cronExpression) {
                    try {
                        const interval = cronParser.parseExpression(schedule.cronExpression);
                        schedule.nextExecution = interval.next().toDate();
                    }
                    catch (error) {
                        throw new Error(`Expressão cron inválida: ${schedule.cronExpression}`);
                    }
                }
                break;
            case job_schedule_entity_1.ScheduleType.INTERVAL:
                if (schedule.intervalMinutes) {
                    schedule.nextExecution = new Date(now.getTime() + schedule.intervalMinutes * 60 * 1000);
                }
                break;
            case job_schedule_entity_1.ScheduleType.SPECIFIC_DATES:
                if (schedule.specificDates && schedule.specificDates.length > 0) {
                    const nextDate = schedule.specificDates.find(date => new Date(date) > now);
                    if (nextDate) {
                        schedule.nextExecution = new Date(nextDate);
                    }
                }
                break;
            case job_schedule_entity_1.ScheduleType.ONCE:
                if (schedule.startDate) {
                    schedule.nextExecution = schedule.startDate;
                }
                else {
                    schedule.nextExecution = now;
                }
                break;
        }
        if (schedule.startDate && schedule.nextExecution < schedule.startDate) {
            schedule.nextExecution = schedule.startDate;
        }
        if (schedule.endDate && schedule.nextExecution > schedule.endDate) {
            schedule.isActive = false;
        }
    }
    async getActiveSchedules() {
        return this.jobScheduleRepository.find({
            where: { isActive: true },
            relations: ['jobQueue'],
            order: { nextExecution: 'ASC' },
        });
    }
    async pauseSchedule(scheduleId) {
        const schedule = await this.jobScheduleRepository.findOne({
            where: { id: scheduleId },
        });
        if (!schedule) {
            throw new Error('Agendamento não encontrado');
        }
        schedule.isActive = false;
        return this.jobScheduleRepository.save(schedule);
    }
    async resumeSchedule(scheduleId) {
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
    async deleteSchedule(scheduleId) {
        const schedule = await this.jobScheduleRepository.findOne({
            where: { id: scheduleId },
        });
        if (!schedule) {
            throw new Error('Agendamento não encontrado');
        }
        await this.jobScheduleRepository.remove(schedule);
    }
};
exports.JobSchedulerService = JobSchedulerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], JobSchedulerService.prototype, "processScheduledJobs", null);
exports.JobSchedulerService = JobSchedulerService = JobSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(job_queue_entity_1.JobQueue)),
    __param(1, (0, typeorm_1.InjectRepository)(job_execution_entity_1.JobExecution)),
    __param(2, (0, typeorm_1.InjectRepository)(job_schedule_entity_1.JobSchedule)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        job_executions_service_1.JobExecutionsService])
], JobSchedulerService);
//# sourceMappingURL=job-scheduler.service.js.map