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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobSchedule = exports.ScheduleType = void 0;
const typeorm_1 = require("typeorm");
const job_queue_entity_1 = require("./job-queue.entity");
var ScheduleType;
(function (ScheduleType) {
    ScheduleType["CRON"] = "cron";
    ScheduleType["INTERVAL"] = "interval";
    ScheduleType["SPECIFIC_DATES"] = "specific_dates";
    ScheduleType["ONCE"] = "once";
})(ScheduleType || (exports.ScheduleType = ScheduleType = {}));
let JobSchedule = class JobSchedule {
};
exports.JobSchedule = JobSchedule;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], JobSchedule.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => job_queue_entity_1.JobQueue, (jobQueue) => jobQueue.schedules, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'job_queue_id' }),
    __metadata("design:type", job_queue_entity_1.JobQueue)
], JobSchedule.prototype, "jobQueue", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ScheduleType,
        default: ScheduleType.CRON,
    }),
    __metadata("design:type", String)
], JobSchedule.prototype, "scheduleType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], JobSchedule.prototype, "cronExpression", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], JobSchedule.prototype, "intervalMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)('json', { nullable: true }),
    __metadata("design:type", Array)
], JobSchedule.prototype, "specificDates", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], JobSchedule.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], JobSchedule.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], JobSchedule.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], JobSchedule.prototype, "nextExecution", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], JobSchedule.prototype, "lastExecution", void 0);
__decorate([
    (0, typeorm_1.Column)('json', { nullable: true }),
    __metadata("design:type", Object)
], JobSchedule.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], JobSchedule.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], JobSchedule.prototype, "updatedAt", void 0);
exports.JobSchedule = JobSchedule = __decorate([
    (0, typeorm_1.Entity)('job_schedules')
], JobSchedule);
//# sourceMappingURL=job-schedule.entity.js.map