import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SaveAiSettingsDto, SaveTerminalSettingsDto } from './settings.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('integrations')
  async getIntegrationSettings() {
    return this.settingsService.getIntegrationSettings();
  }

  @Post('integrations/ai')
  async saveAiSettings(@Body() data: SaveAiSettingsDto) {
    return this.settingsService.saveAiSettings(data);
  }

  @Post('integrations/terminal')
  async saveTerminalSettings(@Body() data: SaveTerminalSettingsDto) {
    return this.settingsService.saveTerminalSettings(data);
  }
}
