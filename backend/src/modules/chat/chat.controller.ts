import { Controller, Get, Param, Query, UseGuards, Delete } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('project/:projectId')
  async getByProject(
    @Param('projectId') projectId: string,
    @Query('limit') limit?: number,
  ) {
    return await this.chatService.findByProject(projectId, limit || 50);
  }

  @Get('session/:sessionId')
  async getBySession(@Param('sessionId') sessionId: string) {
    return await this.chatService.findBySession(sessionId);
  }

  @Get('job-execution/:jobExecutionId')
  async getByJobExecution(@Param('jobExecutionId') jobExecutionId: string) {
    return await this.chatService.findByJobExecution(jobExecutionId);
  }

  @Delete('project/:projectId')
  async deleteByProject(@Param('projectId') projectId: string) {
    await this.chatService.deleteByProject(projectId);
    return { message: 'Chat history deleted successfully' };
  }
}
