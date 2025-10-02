import { SettingsService } from './settings.service';
import { SaveAiSettingsDto, SaveTerminalSettingsDto } from './settings.dto';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    getIntegrationSettings(): Promise<any>;
    saveAiSettings(data: SaveAiSettingsDto): Promise<{
        success: boolean;
        message: string;
    }>;
    saveTerminalSettings(data: SaveTerminalSettingsDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
