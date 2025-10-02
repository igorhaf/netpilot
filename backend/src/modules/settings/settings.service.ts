import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './settings.entity';
import { SaveAiSettingsDto, SaveTerminalSettingsDto } from './settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private settingsRepository: Repository<Setting>,
  ) {}

  async getIntegrationSettings() {
    const settings = await this.settingsRepository.find({
      where: [
        { category: 'ai' },
        { category: 'terminal' }
      ]
    });

    const result: any = {
      ai: {},
      terminal: {}
    };

    settings.forEach(setting => {
      const value = this.parseValue(setting.value);
      if (setting.category === 'ai') {
        const key = setting.key.replace('ai.', '');
        result.ai[key] = value;
      } else if (setting.category === 'terminal') {
        const key = setting.key.replace('terminal.', '');
        result.terminal[key] = value;
      }
    });

    // Set defaults if not found
    if (!result.ai.selectedModel) result.ai.selectedModel = 'gpt-4';
    if (!result.ai.autoSuggestions) result.ai.autoSuggestions = false;
    if (!result.ai.contextAware) result.ai.contextAware = false;
    if (!result.terminal.defaultShell) result.terminal.defaultShell = '/bin/bash';
    if (!result.terminal.workingDirectory) result.terminal.workingDirectory = '/home';

    return result;
  }

  async saveAiSettings(data: SaveAiSettingsDto) {
    const keys = Object.keys(data);

    for (const key of keys) {
      const settingKey = `ai.${key}`;
      const value = this.stringifyValue(data[key]);

      const existing = await this.settingsRepository.findOne({
        where: { key: settingKey }
      });

      if (existing) {
        existing.value = value;
        await this.settingsRepository.save(existing);
      } else {
        const setting = this.settingsRepository.create({
          key: settingKey,
          value,
          category: 'ai',
          description: `AI setting for ${key}`
        });
        await this.settingsRepository.save(setting);
      }
    }

    return { success: true, message: 'AI settings saved successfully' };
  }

  async saveTerminalSettings(data: SaveTerminalSettingsDto) {
    const keys = Object.keys(data);

    for (const key of keys) {
      const settingKey = `terminal.${key}`;
      const value = this.stringifyValue(data[key]);

      const existing = await this.settingsRepository.findOne({
        where: { key: settingKey }
      });

      if (existing) {
        existing.value = value;
        await this.settingsRepository.save(existing);
      } else {
        const setting = this.settingsRepository.create({
          key: settingKey,
          value,
          category: 'terminal',
          description: `Terminal setting for ${key}`
        });
        await this.settingsRepository.save(setting);
      }
    }

    return { success: true, message: 'Terminal settings saved successfully' };
  }

  async getSetting(key: string): Promise<Setting | null> {
    return this.settingsRepository.findOne({ where: { key } });
  }

  async setSetting(key: string, value: any, category?: string, description?: string): Promise<Setting> {
    const existing = await this.getSetting(key);

    if (existing) {
      existing.value = this.stringifyValue(value);
      if (category) existing.category = category;
      if (description) existing.description = description;
      return this.settingsRepository.save(existing);
    }

    const setting = this.settingsRepository.create({
      key,
      value: this.stringifyValue(value),
      category,
      description
    });

    return this.settingsRepository.save(setting);
  }

  private stringifyValue(value: any): string {
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  }

  private parseValue(value: string): any {
    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
}
