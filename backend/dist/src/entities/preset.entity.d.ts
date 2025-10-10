import { Stack } from './stack.entity';
export declare class Preset {
    id: string;
    name: string;
    description: string;
    type: 'docker' | 'persona' | 'template' | 'script' | 'config';
    content: string;
    language: string;
    filename: string;
    tags: string[];
    size: number;
    stacks: Stack[];
    createdAt: Date;
    updatedAt: Date;
}
