import { User } from './user.entity';
import { JobExecution } from './job-execution.entity';
import { Project } from './project.entity';
export declare enum ChatMessageRole {
    USER = "user",
    ASSISTANT = "assistant",
    SYSTEM = "system"
}
export declare enum ChatMessageStatus {
    PENDING = "pending",
    STREAMING = "streaming",
    COMPLETED = "completed",
    ERROR = "error"
}
export declare class ChatMessage {
    id: string;
    role: ChatMessageRole;
    content: string;
    status: ChatMessageStatus;
    user: User;
    project: Project;
    jobExecution: JobExecution;
    sessionId: string;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
