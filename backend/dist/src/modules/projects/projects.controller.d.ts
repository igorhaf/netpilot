import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    create(createProjectDto: CreateProjectDto): Promise<import("../../entities/project.entity").Project>;
    findAll(includeInactive?: string): Promise<import("../../entities/project.entity").Project[]>;
    getStats(): Promise<any>;
    getProjectPresets(id: string): Promise<{
        presets: import("../../entities/preset.entity").Preset[];
        categorized: {
            tecnologias: any[];
            personas: any[];
            templates: any[];
            configs: any[];
            docker: any[];
            scripts: any[];
        };
    }>;
    updateProjectPresets(id: string, body: {
        presetIds: string[];
    }): Promise<{
        presets: import("../../entities/preset.entity").Preset[];
        categorized: {
            tecnologias: any[];
            personas: any[];
            templates: any[];
            configs: any[];
            docker: any[];
            scripts: any[];
        };
    }>;
    findOne(id: string): Promise<import("../../entities/project.entity").Project>;
    update(id: string, updateProjectDto: UpdateProjectDto): Promise<import("../../entities/project.entity").Project>;
    remove(id: string): Promise<void>;
    cloneRepository(id: string): Promise<import("../../entities/project.entity").Project>;
    generateSshKey(id: string): Promise<import("../../entities/project.entity").Project>;
    getSshPublicKey(id: string): Promise<{
        publicKey: string;
        fingerprint: string;
    }>;
    deleteSshKey(id: string): Promise<import("../../entities/project.entity").Project>;
    executePrompt(id: string, body: {
        prompt: string;
    }, req?: any): Promise<any>;
    executeCommand(id: string, body: {
        command: string;
    }, req?: any): Promise<any>;
    getGitStatus(id: string): Promise<any>;
    gitPull(id: string): Promise<any>;
    gitCommit(id: string, body: {
        message: string;
    }): Promise<any>;
    gitPush(id: string): Promise<any>;
    getGitDiff(id: string): Promise<any>;
    generateCommitMessage(id: string): Promise<any>;
}
