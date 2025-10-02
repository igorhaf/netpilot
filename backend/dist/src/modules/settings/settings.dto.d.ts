export declare class SaveAiSettingsDto {
    prompts?: string;
    commits?: string;
    promptImprovement?: string;
    translation?: string;
    commands?: string;
}
export declare class SaveTerminalSettingsDto {
    defaultShell?: string;
    workingDirectory?: string;
}
export declare class SettingDto {
    key: string;
    value?: string;
    category?: string;
    description?: string;
}
