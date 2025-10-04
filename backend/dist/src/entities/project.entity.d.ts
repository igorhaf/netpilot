import { Domain } from './domain.entity';
import { Stack } from './stack.entity';
import { Preset } from './preset.entity';
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
    defaultPromptTemplate: string;
    executionMode: 'realtime' | 'queue';
    stacks: Stack[];
    presets: Preset[];
    domains: Domain[];
    createdAt: Date;
    updatedAt: Date;
}
