"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobQueuesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const schedule_1 = require("@nestjs/schedule");
const bull_1 = require("@nestjs/bull");
const job_queue_entity_1 = require("../../entities/job-queue.entity");
const job_execution_entity_1 = require("../../entities/job-execution.entity");
const job_schedule_entity_1 = require("../../entities/job-schedule.entity");
const job_queues_service_1 = require("./job-queues.service");
const job_executions_service_1 = require("./job-executions.service");
const job_scheduler_service_1 = require("./job-scheduler.service");
const job_queues_gateway_1 = require("./job-queues.gateway");
const redis_queue_service_1 = require("../redis/redis-queue.service");
const job_queues_controller_1 = require("./job-queues.controller");
let JobQueuesModule = class JobQueuesModule {
};
exports.JobQueuesModule = JobQueuesModule;
exports.JobQueuesModule = JobQueuesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([job_queue_entity_1.JobQueue, job_execution_entity_1.JobExecution, job_schedule_entity_1.JobSchedule]),
            schedule_1.ScheduleModule.forRoot(),
            bull_1.BullModule.registerQueue({
                name: 'job-processor',
            }),
        ],
        controllers: [
            job_queues_controller_1.JobQueuesController,
            job_queues_controller_1.JobExecutionsController,
            job_queues_controller_1.JobSchedulesController,
        ],
        providers: [
            job_queues_service_1.JobQueuesService,
            job_executions_service_1.JobExecutionsService,
            job_scheduler_service_1.JobSchedulerService,
            job_queues_gateway_1.JobQueuesGateway,
            redis_queue_service_1.RedisQueueService,
        ],
        exports: [
            job_queues_service_1.JobQueuesService,
            job_executions_service_1.JobExecutionsService,
            job_scheduler_service_1.JobSchedulerService,
        ],
    })
], JobQueuesModule);
//# sourceMappingURL=job-queues.module.js.map