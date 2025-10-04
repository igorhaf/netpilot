import { ChatService } from './chat.service';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    getByProject(projectId: string, limit?: number): Promise<import("../../entities/chat-message.entity").ChatMessage[]>;
    getBySession(sessionId: string): Promise<import("../../entities/chat-message.entity").ChatMessage[]>;
    getByJobExecution(jobExecutionId: string): Promise<import("../../entities/chat-message.entity").ChatMessage[]>;
    deleteByProject(projectId: string): Promise<{
        message: string;
    }>;
}
