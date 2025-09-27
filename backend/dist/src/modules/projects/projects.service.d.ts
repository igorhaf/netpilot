import { Repository } from 'typeorm';
import { Project } from '../../entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
export declare class ProjectsService {
    private projectRepository;
    constructor(projectRepository: Repository<Project>);
    create(createProjectDto: CreateProjectDto): Promise<Project>;
    findAll(includeInactive?: boolean): Promise<Project[]>;
    findOne(id: string): Promise<Project>;
    update(id: string, updateProjectDto: UpdateProjectDto): Promise<Project>;
    remove(id: string): Promise<void>;
    getStats(): Promise<any>;
}
