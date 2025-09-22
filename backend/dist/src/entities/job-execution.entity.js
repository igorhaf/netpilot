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
exports.JobExecution = exports.TriggerType = exports.ExecutionStatus = void 0;
const typeorm_1 = require("typeorm");
const job_queue_entity_1 = require("./job-queue.entity");
const user_entity_1 = require("./user.entity");
var ExecutionStatus;
(function (ExecutionStatus) {
    ExecutionStatus["PENDING"] = "pending";
    ExecutionStatus["RUNNING"] = "running";
    ExecutionStatus["COMPLETED"] = "completed";
    ExecutionStatus["FAILED"] = "failed";
    ExecutionStatus["CANCELLED"] = "cancelled";
    ExecutionStatus["TIMEOUT"] = "timeout";
})(ExecutionStatus || (exports.ExecutionStatus = ExecutionStatus = {}));
var TriggerType;
(function (TriggerType) {
    TriggerType["SCHEDULED"] = "scheduled";
    TriggerType["MANUAL"] = "manual";
    TriggerType["API"] = "api";
})(TriggerType || (exports.TriggerType = TriggerType = {}));
let JobExecution = class JobExecution {
};
exports.JobExecution = JobExecution;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], JobExecution.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => job_queue_entity_1.JobQueue, (jobQueue) => jobQueue.executions, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'job_queue_id' }),
    __metadata("design:type", job_queue_entity_1.JobQueue)
], JobExecution.prototype, "jobQueue", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ExecutionStatus,
        default: ExecutionStatus.PENDING,
    }),
    __metadata("design:type", String)
], JobExecution.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], JobExecution.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], JobExecution.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], JobExecution.prototype, "executionTimeMs", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], JobExecution.prototype, "outputLog", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], JobExecution.prototype, "errorLog", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], JobExecution.prototype, "retryCount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: TriggerType,
        default: TriggerType.SCHEDULED,
    }),
    __metadata("design:type", String)
], JobExecution.prototype, "triggerType", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'triggered_by' }),
    __metadata("design:type", user_entity_1.User)
], JobExecution.prototype, "triggeredBy", void 0);
__decorate([
    (0, typeorm_1.Column)('json', { nullable: true }),
    __metadata("design:type", Object)
], JobExecution.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], JobExecution.prototype, "pid", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], JobExecution.prototype, "createdAt", void 0);
exports.JobExecution = JobExecution = __decorate([
    (0, typeorm_1.Entity)('job_executions')
], JobExecution);
//# sourceMappingURL=job-execution.entity.js.map