"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const settings_entity_1 = require("./settings.entity");
let SettingsService = class SettingsService {
    constructor(settingsRepository) {
        this.settingsRepository = settingsRepository;
    }
    async getIntegrationSettings() {
        const settings = await this.settingsRepository.find({
            where: [
                { category: 'ai' },
                { category: 'terminal' }
            ]
        });
        const result = {
            ai: {},
            terminal: {}
        };
        settings.forEach(setting => {
            const value = this.parseValue(setting.value);
            if (setting.category === 'ai') {
                const key = setting.key.replace('ai.', '');
                result.ai[key] = value;
            }
            else if (setting.category === 'terminal') {
                const key = setting.key.replace('terminal.', '');
                result.terminal[key] = value;
            }
        });
        if (!result.ai.selectedModel)
            result.ai.selectedModel = 'gpt-4';
        if (!result.ai.autoSuggestions)
            result.ai.autoSuggestions = false;
        if (!result.ai.contextAware)
            result.ai.contextAware = false;
        if (!result.terminal.defaultShell)
            result.terminal.defaultShell = '/bin/bash';
        if (!result.terminal.workingDirectory)
            result.terminal.workingDirectory = '/home';
        return result;
    }
    async saveAiSettings(data) {
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
            }
            else {
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
    async saveTerminalSettings(data) {
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
            }
            else {
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
    async getSetting(key) {
        return this.settingsRepository.findOne({ where: { key } });
    }
    async setSetting(key, value, category, description) {
        const existing = await this.getSetting(key);
        if (existing) {
            existing.value = this.stringifyValue(value);
            if (category)
                existing.category = category;
            if (description)
                existing.description = description;
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
    stringifyValue(value) {
        if (typeof value === 'string')
            return value;
        return JSON.stringify(value);
    }
    parseValue(value) {
        if (!value)
            return null;
        try {
            return JSON.parse(value);
        }
        catch {
            return value;
        }
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(settings_entity_1.Setting)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SettingsService);
//# sourceMappingURL=settings.service.js.map