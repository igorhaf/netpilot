import { Preset } from './preset.entity';
export declare class Stack {
    id: string;
    name: string;
    description: string;
    technology: string;
    color: string;
    version: string;
    author: string;
    tags: string[];
    isActive: boolean;
    totalPresets: number;
    downloads: number;
    presets: Preset[];
    createdAt: Date;
    updatedAt: Date;
}
