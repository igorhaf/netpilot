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
exports.ChatMessage = exports.ChatMessageStatus = exports.ChatMessageRole = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const job_execution_entity_1 = require("./job-execution.entity");
const project_entity_1 = require("./project.entity");
var ChatMessageRole;
(function (ChatMessageRole) {
    ChatMessageRole["USER"] = "user";
    ChatMessageRole["ASSISTANT"] = "assistant";
    ChatMessageRole["SYSTEM"] = "system";
})(ChatMessageRole || (exports.ChatMessageRole = ChatMessageRole = {}));
var ChatMessageStatus;
(function (ChatMessageStatus) {
    ChatMessageStatus["PENDING"] = "pending";
    ChatMessageStatus["STREAMING"] = "streaming";
    ChatMessageStatus["COMPLETED"] = "completed";
    ChatMessageStatus["ERROR"] = "error";
})(ChatMessageStatus || (exports.ChatMessageStatus = ChatMessageStatus = {}));
let ChatMessage = class ChatMessage {
};
exports.ChatMessage = ChatMessage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ChatMessage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ChatMessageRole,
        default: ChatMessageRole.USER,
    }),
    __metadata("design:type", String)
], ChatMessage.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], ChatMessage.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ChatMessageStatus,
        default: ChatMessageStatus.COMPLETED,
    }),
    __metadata("design:type", String)
], ChatMessage.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], ChatMessage.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'project_id' }),
    __metadata("design:type", project_entity_1.Project)
], ChatMessage.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => job_execution_entity_1.JobExecution, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'job_execution_id' }),
    __metadata("design:type", job_execution_entity_1.JobExecution)
], ChatMessage.prototype, "jobExecution", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'session_id', nullable: true }),
    __metadata("design:type", String)
], ChatMessage.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { nullable: true }),
    __metadata("design:type", Object)
], ChatMessage.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ChatMessage.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ChatMessage.prototype, "updatedAt", void 0);
exports.ChatMessage = ChatMessage = __decorate([
    (0, typeorm_1.Entity)('chat_messages')
], ChatMessage);
//# sourceMappingURL=chat-message.entity.js.map