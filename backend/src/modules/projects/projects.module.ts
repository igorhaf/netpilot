import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project } from '../../entities/project.entity';
import { Stack } from '../../entities/stack.entity';
import { Preset } from '../../entities/preset.entity';
import { JobExecution } from '../../entities/job-execution.entity';
import { LogsModule } from '../logs/logs.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Stack, Preset, JobExecution]),
    LogsModule,
    ChatModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}