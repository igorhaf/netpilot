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
exports.JobSchedulesController = exports.JobExecutionsController = exports.JobQueuesController = void 0;
const common_1 = require("@nestjs/common");
const job_queues_service_1 = require("./job-queues.service");
const job_executions_service_1 = require("./job-executions.service");
const job_scheduler_service_1 = require("./job-scheduler.service");
const create_job_queue_dto_1 = require("./dto/create-job-queue.dto");
const update_job_queue_dto_1 = require("./dto/update-job-queue.dto");
const execute_job_dto_1 = require("./dto/execute-job.dto");
const job_execution_query_dto_1 = require("./dto/job-execution-query.dto");
const jwt_auth_guard_1 = require("../../guards/jwt-auth.guard");
let JobQueuesController = class JobQueuesController {
    constructor(jobQueuesService, jobExecutionsService, jobSchedulerService) {
        this.jobQueuesService = jobQueuesService;
        this.jobExecutionsService = jobExecutionsService;
        this.jobSchedulerService = jobSchedulerService;
    }
    create(createJobQueueDto, req) {
        return this.jobQueuesService.create(createJobQueueDto, req.user?.id);
    }
    findAll(search, isActive) {
        const active = isActive ? isActive === 'true' : undefined;
        return this.jobQueuesService.findAll(search, active);
    }
    getStatistics() {
        return this.jobQueuesService.getStatistics();
    }
    getUpcomingExecutions(limit) {
        const limitNum = limit ? parseInt(limit, 10) : 10;
        return this.jobQueuesService.getUpcomingExecutions(limitNum);
    }
    findOne(id) {
        return this.jobQueuesService.findOne(id);
    }
    update(id, updateJobQueueDto) {
        return this.jobQueuesService.update(id, updateJobQueueDto);
    }
    remove(id) {
        return this.jobQueuesService.remove(id);
    }
    executeJob(id, executeJobDto, req) {
        return this.jobExecutionsService.executeJob(id, executeJobDto, req.user?.id);
    }
    toggleActive(id) {
        return this.jobQueuesService.toggleActive(id);
    }
    validateCron(id, cronExpression) {
        return this.jobQueuesService.validateCronExpression(cronExpression);
    }
};
exports.JobQueuesController = JobQueuesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_job_queue_dto_1.CreateJobQueueDto, Object]),
    __metadata("design:returntype", void 0)
], JobQueuesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('isActive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], JobQueuesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('statistics'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], JobQueuesController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)('upcoming'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], JobQueuesController.prototype, "getUpcomingExecutions", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], JobQueuesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_job_queue_dto_1.UpdateJobQueueDto]),
    __metadata("design:returntype", void 0)
], JobQueuesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], JobQueuesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/execute'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, execute_job_dto_1.ExecuteJobDto, Object]),
    __metadata("design:returntype", void 0)
], JobQueuesController.prototype, "executeJob", null);
__decorate([
    (0, common_1.Post)(':id/toggle'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], JobQueuesController.prototype, "toggleActive", null);
__decorate([
    (0, common_1.Post)(':id/validate-cron'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('cronExpression')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], JobQueuesController.prototype, "validateCron", null);
exports.JobQueuesController = JobQueuesController = __decorate([
    (0, common_1.Controller)('job-queues'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [job_queues_service_1.JobQueuesService,
        job_executions_service_1.JobExecutionsService,
        job_scheduler_service_1.JobSchedulerService])
], JobQueuesController);
let JobExecutionsController = class JobExecutionsController {
    constructor(jobExecutionsService) {
        this.jobExecutionsService = jobExecutionsService;
    }
    findAll(queryDto) {
        return this.jobExecutionsService.findAll(queryDto);
    }
    findOne(id) {
        return this.jobExecutionsService.findOne(id);
    }
    cancel(id) {
        return this.jobExecutionsService.cancel(id);
    }
    retry(id) {
        return this.jobExecutionsService.retry(id);
    }
    getLogs(id) {
        return this.jobExecutionsService.findOne(id).then(execution => ({
            outputLog: execution.outputLog,
            errorLog: execution.errorLog,
        }));
    }
    getRedisStats() {
        return this.jobExecutionsService.getRedisStats();
    }
    getRedisHealth() {
        return this.jobExecutionsService.getRedisHealth();
    }
};
exports.JobExecutionsController = JobExecutionsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [job_execution_query_dto_1.JobExecutionQueryDto]),
    __metadata("design:returntype", void 0)
], JobExecutionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], JobExecutionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], JobExecutionsController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)(':id/retry'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], JobExecutionsController.prototype, "retry", null);
__decorate([
    (0, common_1.Get)(':id/logs'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], JobExecutionsController.prototype, "getLogs", null);
__decorate([
    (0, common_1.Get)('redis/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], JobExecutionsController.prototype, "getRedisStats", null);
__decorate([
    (0, common_1.Get)('redis/health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], JobExecutionsController.prototype, "getRedisHealth", null);
exports.JobExecutionsController = JobExecutionsController = __decorate([
    (0, common_1.Controller)('job-executions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [job_executions_service_1.JobExecutionsService])
], JobExecutionsController);
let JobSchedulesController = class JobSchedulesController {
    constructor(jobSchedulerService) {
        this.jobSchedulerService = jobSchedulerService;
    }
    getActiveSchedules() {
        return this.jobSchedulerService.getActiveSchedules();
    }
    createSchedule(jobQueueId, scheduleData) {
        return this.jobSchedulerService.createSchedule(jobQueueId, scheduleData);
    }
    pauseSchedule(id) {
        return this.jobSchedulerService.pauseSchedule(id);
    }
    resumeSchedule(id) {
        return this.jobSchedulerService.resumeSchedule(id);
    }
    deleteSchedule(id) {
        return this.jobSchedulerService.deleteSchedule(id);
    }
};
exports.JobSchedulesController = JobSchedulesController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], JobSchedulesController.prototype, "getActiveSchedules", null);
__decorate([
    (0, common_1.Post)(':jobQueueId'),
    __param(0, (0, common_1.Param)('jobQueueId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], JobSchedulesController.prototype, "createSchedule", null);
__decorate([
    (0, common_1.Post)(':id/pause'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], JobSchedulesController.prototype, "pauseSchedule", null);
__decorate([
    (0, common_1.Post)(':id/resume'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], JobSchedulesController.prototype, "resumeSchedule", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], JobSchedulesController.prototype, "deleteSchedule", null);
exports.JobSchedulesController = JobSchedulesController = __decorate([
    (0, common_1.Controller)('job-schedules'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [job_scheduler_service_1.JobSchedulerService])
], JobSchedulesController);
//# sourceMappingURL=job-queues.controller.js.map