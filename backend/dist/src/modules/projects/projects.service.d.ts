import { Repository } from 'typeorm';
import { Project } from '../../entities/project.entity';
import { Stack } from '../../entities/stack.entity';
import { Preset } from '../../entities/preset.entity';
import { JobQueue } from '../../entities/job-queue.entity';
import { JobExecution } from '../../entities/job-execution.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { LogsService } from '../logs/logs.service';
import { ChatService } from '../chat/chat.service';
export declare class ProjectsService {
    private projectRepository;
    private stackRepository;
    private presetRepository;
    private jobQueueRepository;
    private jobExecutionRepository;
    private logsService;
    private chatService;
    constructor(projectRepository: Repository<Project>, stackRepository: Repository<Stack>, presetRepository: Repository<Preset>, jobQueueRepository: Repository<JobQueue>, jobExecutionRepository: Repository<JobExecution>, logsService: LogsService, chatService: ChatService);
    create(createProjectDto: CreateProjectDto): Promise<Project>;
    findAll(includeInactive?: boolean): Promise<Project[]>;
    findOne(id: string): Promise<Project>;
    update(id: string, updateProjectDto: UpdateProjectDto): Promise<Project>;
    remove(id: string): Promise<void>;
    getStats(): Promise<any>;
    cloneRepository(id: string): Promise<Project>;
    generateSshKey(id: string): Promise<Project>;
    getSshPublicKey(id: string): Promise<{
        publicKey: string;
        fingerprint: string;
    }>;
    deleteSshKey(id: string): Promise<Project>;
    private applyPresetsToProject;
    private writePresetFile;
    private getPresetExtension;
    executePromptRealtime(id: string, userPrompt: string, userId?: string): Promise<any>;
    executeCommand(id: string, command: string, userId?: string): Promise<any>;
    private loadContexts;
}
