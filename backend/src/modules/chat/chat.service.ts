import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage, ChatMessageRole, ChatMessageStatus } from '../../entities/chat-message.entity';
import { User } from '../../entities/user.entity';
import { Project } from '../../entities/project.entity';
import { JobExecution } from '../../entities/job-execution.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
  ) {}

  async create(data: {
    role: ChatMessageRole;
    content: string;
    userId?: string;
    projectId?: string;
    jobExecutionId?: string;
    sessionId?: string;
    status?: ChatMessageStatus;
    metadata?: Record<string, any>;
  }): Promise<ChatMessage> {
    const message = this.chatMessageRepository.create({
      role: data.role,
      content: data.content,
      status: data.status || ChatMessageStatus.COMPLETED,
      user: data.userId ? ({ id: data.userId } as User) : null,
      project: data.projectId ? ({ id: data.projectId } as Project) : null,
      jobExecution: data.jobExecutionId ? ({ id: data.jobExecutionId } as JobExecution) : null,
      sessionId: data.sessionId,
      metadata: data.metadata,
    });

    return await this.chatMessageRepository.save(message);
  }

  async update(id: string, data: Partial<ChatMessage>): Promise<ChatMessage> {
    await this.chatMessageRepository.update(id, data);
    return await this.chatMessageRepository.findOne({ where: { id } });
  }

  async findByProject(projectId: string, limit: number = 50): Promise<ChatMessage[]> {
    return await this.chatMessageRepository.find({
      where: { project: { id: projectId } },
      relations: ['user', 'jobExecution'],
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  async findBySession(sessionId: string): Promise<ChatMessage[]> {
    return await this.chatMessageRepository.find({
      where: { sessionId },
      relations: ['user', 'project', 'jobExecution'],
      order: { createdAt: 'ASC' },
    });
  }

  async findByJobExecution(jobExecutionId: string): Promise<ChatMessage[]> {
    return await this.chatMessageRepository.find({
      where: { jobExecution: { id: jobExecutionId } },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async deleteByProject(projectId: string): Promise<void> {
    await this.chatMessageRepository.delete({ project: { id: projectId } });
  }
}
