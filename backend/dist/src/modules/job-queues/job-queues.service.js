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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobQueuesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const job_queue_entity_1 = require("../../entities/job-queue.entity");
const job_execution_entity_1 = require("../../entities/job-execution.entity");
const job_schedule_entity_1 = require("../../entities/job-schedule.entity");
const cronParser = require("cron-parser");
let JobQueuesService = class JobQueuesService {
    constructor(jobQueueRepository, jobExecutionRepository, jobScheduleRepository) {
        this.jobQueueRepository = jobQueueRepository;
        this.jobExecutionRepository = jobExecutionRepository;
        this.jobScheduleRepository = jobScheduleRepository;
    }
    async create(createJobQueueDto, userId) {
        const existingJob = await this.jobQueueRepository.findOne({
            where: { name: createJobQueueDto.name },
        });
        if (existingJob) {
            throw new common_1.ConflictException('Job com este nome já existe');
        }
        if (createJobQueueDto.cronExpression) {
            const cronValidation = this.validateCronExpression(createJobQueueDto.cronExpression);
            if (!cronValidation.isValid) {
                throw new common_1.BadRequestException(`Expressão cron inválida: ${cronValidation.error}`);
            }
        }
        const jobQueue = this.jobQueueRepository.create({
            ...createJobQueueDto,
            createdBy: userId ? { id: userId } : null,
        });
        return this.jobQueueRepository.save(jobQueue);
    }
    async findAll(search, isActive) {
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
    async findOne(id) {
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
            throw new common_1.NotFoundException('Job não encontrado');
        }
        return jobQueue;
    }
    async update(id, updateJobQueueDto) {
        const jobQueue = await this.findOne(id);
        if (updateJobQueueDto.name && updateJobQueueDto.name !== jobQueue.name) {
            const existingJob = await this.jobQueueRepository.findOne({
                where: { name: updateJobQueueDto.name },
            });
            if (existingJob) {
                throw new common_1.ConflictException('Job com este nome já existe');
            }
        }
        if (updateJobQueueDto.cronExpression) {
            const cronValidation = this.validateCronExpression(updateJobQueueDto.cronExpression);
            if (!cronValidation.isValid) {
                throw new common_1.BadRequestException(`Expressão cron inválida: ${cronValidation.error}`);
            }
        }
        Object.assign(jobQueue, updateJobQueueDto);
        return this.jobQueueRepository.save(jobQueue);
    }
    async remove(id) {
        const jobQueue = await this.findOne(id);
        await this.jobExecutionRepository.update({
            jobQueue: { id },
            status: job_execution_entity_1.ExecutionStatus.RUNNING
        }, { status: job_execution_entity_1.ExecutionStatus.CANCELLED });
        await this.jobQueueRepository.remove(jobQueue);
    }
    async toggleActive(id) {
        const jobQueue = await this.findOne(id);
        jobQueue.isActive = !jobQueue.isActive;
        return this.jobQueueRepository.save(jobQueue);
    }
    validateCronExpression(cronExpression) {
        try {
            const interval = cronParser.parseExpression(cronExpression);
            const nextExecutions = [];
            for (let i = 0; i < 5; i++) {
                nextExecutions.push(interval.next().toDate());
            }
            return {
                isValid: true,
                nextExecutions,
            };
        }
        catch (error) {
            return {
                isValid: false,
                error: error.message,
            };
        }
    }
    async getStatistics() {
        const [totalJobs, activeJobs, completedExecutions, failedExecutions, avgExecutionTime] = await Promise.all([
            this.jobQueueRepository.count(),
            this.jobQueueRepository.count({ where: { isActive: true } }),
            this.jobExecutionRepository.count({ where: { status: job_execution_entity_1.ExecutionStatus.COMPLETED } }),
            this.jobExecutionRepository.count({ where: { status: job_execution_entity_1.ExecutionStatus.FAILED } }),
            this.jobExecutionRepository
                .createQueryBuilder('execution')
                .select('AVG(execution."executionTimeMs")', 'avg')
                .where('execution.status = :status', { status: job_execution_entity_1.ExecutionStatus.COMPLETED })
                .getRawOne()
        ]);
        return {
            totalJobs,
            activeJobs,
            completedExecutions,
            failedExecutions,
            averageExecutionTime: Math.round(Number(avgExecutionTime?.avg) || 0),
            upcomingExecutions: 0,
        };
    }
    async getUpcomingExecutions(limit = 10) {
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
                }
                catch (error) {
                }
            }
        }
        return upcomingExecutions
            .sort((a, b) => a.nextExecution.getTime() - b.nextExecution.getTime())
            .slice(0, limit);
    }
};
exports.JobQueuesService = JobQueuesService;
exports.JobQueuesService = JobQueuesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(job_queue_entity_1.JobQueue)),
    __param(1, (0, typeorm_1.InjectRepository)(job_execution_entity_1.JobExecution)),
    __param(2, (0, typeorm_1.InjectRepository)(job_schedule_entity_1.JobSchedule)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], JobQueuesService);
//# sourceMappingURL=job-queues.service.js.map