export declare class CreatePresetDto {
    name: string;
    description?: string;
    type: 'docker' | 'persona' | 'template' | 'script' | 'config';
    content: string;
    language?: string;
    filename?: string;
    tags?: string[];
    stackIds?: string[];
}
