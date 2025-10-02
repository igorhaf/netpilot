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
exports.SettingsController = void 0;
const common_1 = require("@nestjs/common");
const settings_service_1 = require("./settings.service");
const settings_dto_1 = require("./settings.dto");
const jwt_auth_guard_1 = require("../../guards/jwt-auth.guard");
let SettingsController = class SettingsController {
    constructor(settingsService) {
        this.settingsService = settingsService;
    }
    async getIntegrationSettings() {
        return this.settingsService.getIntegrationSettings();
    }
    async saveAiSettings(data) {
        return this.settingsService.saveAiSettings(data);
    }
    async saveTerminalSettings(data) {
        return this.settingsService.saveTerminalSettings(data);
    }
};
exports.SettingsController = SettingsController;
__decorate([
    (0, common_1.Get)('integrations'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getIntegrationSettings", null);
__decorate([
    (0, common_1.Post)('integrations/ai'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [settings_dto_1.SaveAiSettingsDto]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "saveAiSettings", null);
__decorate([
    (0, common_1.Post)('integrations/terminal'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [settings_dto_1.SaveTerminalSettingsDto]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "saveTerminalSettings", null);
exports.SettingsController = SettingsController = __decorate([
    (0, common_1.Controller)('settings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [settings_service_1.SettingsService])
], SettingsController);
//# sourceMappingURL=settings.controller.js.map