"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresetsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const preset_entity_1 = require("../../entities/preset.entity");
const stack_entity_1 = require("../../entities/stack.entity");
const presets_service_1 = require("./presets.service");
const presets_controller_1 = require("./presets.controller");
let PresetsModule = class PresetsModule {
};
exports.PresetsModule = PresetsModule;
exports.PresetsModule = PresetsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([preset_entity_1.Preset, stack_entity_1.Stack])],
        controllers: [presets_controller_1.PresetsController],
        providers: [presets_service_1.PresetsService],
        exports: [presets_service_1.PresetsService],
    })
], PresetsModule);
//# sourceMappingURL=presets.module.js.map