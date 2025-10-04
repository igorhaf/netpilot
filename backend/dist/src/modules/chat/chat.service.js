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
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const chat_message_entity_1 = require("../../entities/chat-message.entity");
let ChatService = class ChatService {
    constructor(chatMessageRepository) {
        this.chatMessageRepository = chatMessageRepository;
    }
    async create(data) {
        const message = this.chatMessageRepository.create({
            role: data.role,
            content: data.content,
            status: data.status || chat_message_entity_1.ChatMessageStatus.COMPLETED,
            user: data.userId ? { id: data.userId } : null,
            project: data.projectId ? { id: data.projectId } : null,
            jobExecution: data.jobExecutionId ? { id: data.jobExecutionId } : null,
            sessionId: data.sessionId,
            metadata: data.metadata,
        });
        return await this.chatMessageRepository.save(message);
    }
    async update(id, data) {
        await this.chatMessageRepository.update(id, data);
        return await this.chatMessageRepository.findOne({ where: { id } });
    }
    async findByProject(projectId, limit = 50) {
        return await this.chatMessageRepository.find({
            where: { project: { id: projectId } },
            relations: ['user', 'jobExecution'],
            order: { createdAt: 'ASC' },
            take: limit,
        });
    }
    async findBySession(sessionId) {
        return await this.chatMessageRepository.find({
            where: { sessionId },
            relations: ['user', 'project', 'jobExecution'],
            order: { createdAt: 'ASC' },
        });
    }
    async findByJobExecution(jobExecutionId) {
        return await this.chatMessageRepository.find({
            where: { jobExecution: { id: jobExecutionId } },
            relations: ['user'],
            order: { createdAt: 'ASC' },
        });
    }
    async deleteByProject(projectId) {
        await this.chatMessageRepository.delete({ project: { id: projectId } });
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(chat_message_entity_1.ChatMessage)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ChatService);
//# sourceMappingURL=chat.service.js.map