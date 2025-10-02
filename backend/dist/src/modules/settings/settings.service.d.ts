import { Repository } from 'typeorm';
import { Setting } from './settings.entity';
import { SaveAiSettingsDto, SaveTerminalSettingsDto } from './settings.dto';
export declare class SettingsService {
    private settingsRepository;
    constructor(settingsRepository: Repository<Setting>);
    getIntegrationSettings(): Promise<any>;
    saveAiSettings(data: SaveAiSettingsDto): Promise<{
        success: boolean;
        message: string;
    }>;
    saveTerminalSettings(data: SaveTerminalSettingsDto): Promise<{
        success: boolean;
        message: string;
    }>;
    getSetting(key: string): Promise<Setting | null>;
    setSetting(key: string, value: any, category?: string, description?: string): Promise<Setting>;
    private stringifyValue;
    private parseValue;
}
