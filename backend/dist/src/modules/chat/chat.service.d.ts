import { Repository } from 'typeorm';
import { ChatMessage, ChatMessageRole, ChatMessageStatus } from '../../entities/chat-message.entity';
export declare class ChatService {
    private readonly chatMessageRepository;
    constructor(chatMessageRepository: Repository<ChatMessage>);
    create(data: {
        role: ChatMessageRole;
        content: string;
        userId?: string;
        projectId?: string;
        jobExecutionId?: string;
        sessionId?: string;
        status?: ChatMessageStatus;
        metadata?: Record<string, any>;
    }): Promise<ChatMessage>;
    update(id: string, data: Partial<ChatMessage>): Promise<ChatMessage>;
    findByProject(projectId: string, limit?: number): Promise<ChatMessage[]>;
    findBySession(sessionId: string): Promise<ChatMessage[]>;
    findByJobExecution(jobExecutionId: string): Promise<ChatMessage[]>;
    deleteByProject(projectId: string): Promise<void>;
}
