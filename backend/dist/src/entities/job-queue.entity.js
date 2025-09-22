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
exports.JobQueue = exports.ScriptType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const job_execution_entity_1 = require("./job-execution.entity");
const job_schedule_entity_1 = require("./job-schedule.entity");
var ScriptType;
(function (ScriptType) {
    ScriptType["SHELL"] = "shell";
    ScriptType["NODE"] = "node";
    ScriptType["PYTHON"] = "python";
    ScriptType["INTERNAL"] = "internal";
})(ScriptType || (exports.ScriptType = ScriptType = {}));
let JobQueue = class JobQueue {
};
exports.JobQueue = JobQueue;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], JobQueue.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], JobQueue.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], JobQueue.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], JobQueue.prototype, "scriptPath", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ScriptType,
        default: ScriptType.INTERNAL,
    }),
    __metadata("design:type", String)
], JobQueue.prototype, "scriptType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], JobQueue.prototype, "cronExpression", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], JobQueue.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 5 }),
    __metadata("design:type", Number)
], JobQueue.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 3 }),
    __metadata("design:type", Number)
], JobQueue.prototype, "maxRetries", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 300 }),
    __metadata("design:type", Number)
], JobQueue.prototype, "timeoutSeconds", void 0);
__decorate([
    (0, typeorm_1.Column)('json', { nullable: true }),
    __metadata("design:type", Object)
], JobQueue.prototype, "environmentVars", void 0);
__decorate([
    (0, typeorm_1.Column)('json', { nullable: true }),
    __metadata("design:type", Object)
], JobQueue.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], JobQueue.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => job_execution_entity_1.JobExecution, (execution) => execution.jobQueue),
    __metadata("design:type", Array)
], JobQueue.prototype, "executions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => job_schedule_entity_1.JobSchedule, (schedule) => schedule.jobQueue),
    __metadata("design:type", Array)
], JobQueue.prototype, "schedules", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], JobQueue.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], JobQueue.prototype, "updatedAt", void 0);
exports.JobQueue = JobQueue = __decorate([
    (0, typeorm_1.Entity)('job_queues')
], JobQueue);
//# sourceMappingURL=job-queue.entity.js.map