import { Domain } from './domain.entity';
export declare class Project {
    id: string;
    name: string;
    alias: string;
    projectPath: string;
    description: string;
    isActive: boolean;
    technologies: string[];
    repository: string;
    cloned: boolean;
    hasSshKey: boolean;
    sshPublicKey: string;
    sshKeyFingerprint: string;
    documentation: string;
    aiSessionData: string;
    mainDomain: string;
    metadata: Record<string, any>;
    domains: Domain[];
    createdAt: Date;
    updatedAt: Date;
}
