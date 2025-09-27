export declare class CreateProjectDto {
    name: string;
    alias: string;
    description?: string;
    isActive?: boolean;
    technologies?: string[];
    repository: string;
    documentation?: string;
    aiSessionData?: string;
    mainDomain?: string;
    metadata?: Record<string, any>;
}
