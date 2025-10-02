import { Repository } from 'typeorm';
import { Project } from '../../entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { LogsService } from '../logs/logs.service';
export declare class ProjectsService {
    private projectRepository;
    private logsService;
    constructor(projectRepository: Repository<Project>, logsService: LogsService);
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
}
