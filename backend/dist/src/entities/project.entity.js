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
exports.Project = void 0;
const typeorm_1 = require("typeorm");
const domain_entity_1 = require("./domain.entity");
const stack_entity_1 = require("./stack.entity");
const preset_entity_1 = require("./preset.entity");
const job_queue_entity_1 = require("./job-queue.entity");
let Project = class Project {
};
exports.Project = Project;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Project.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Project.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Project.prototype, "alias", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Project.prototype, "projectPath", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Project.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Project.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)('simple-array', { nullable: true }),
    __metadata("design:type", Array)
], Project.prototype, "technologies", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Project.prototype, "repository", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Project.prototype, "cloned", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Project.prototype, "hasSshKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Project.prototype, "sshPublicKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Project.prototype, "sshKeyFingerprint", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Project.prototype, "documentation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Project.prototype, "aiSessionData", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Project.prototype, "mainDomain", void 0);
__decorate([
    (0, typeorm_1.Column)('simple-json', { nullable: true }),
    __metadata("design:type", Object)
], Project.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Project.prototype, "defaultPromptTemplate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['realtime', 'queue'],
        default: 'queue'
    }),
    __metadata("design:type", String)
], Project.prototype, "executionMode", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Project.prototype, "jobQueueId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => job_queue_entity_1.JobQueue, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'jobQueueId' }),
    __metadata("design:type", job_queue_entity_1.JobQueue)
], Project.prototype, "jobQueue", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => stack_entity_1.Stack, { eager: true }),
    (0, typeorm_1.JoinTable)({
        name: 'project_stacks',
        joinColumn: { name: 'project_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'stack_id', referencedColumnName: 'id' }
    }),
    __metadata("design:type", Array)
], Project.prototype, "stacks", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => preset_entity_1.Preset, { eager: true }),
    (0, typeorm_1.JoinTable)({
        name: 'project_presets',
        joinColumn: { name: 'project_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'preset_id', referencedColumnName: 'id' }
    }),
    __metadata("design:type", Array)
], Project.prototype, "presets", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => domain_entity_1.Domain, (domain) => domain.project),
    __metadata("design:type", Array)
], Project.prototype, "domains", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Project.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Project.prototype, "updatedAt", void 0);
exports.Project = Project = __decorate([
    (0, typeorm_1.Entity)('projects')
], Project);
//# sourceMappingURL=project.entity.js.map