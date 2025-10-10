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
exports.PresetsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const presets_service_1 = require("./presets.service");
const create_preset_dto_1 = require("./dto/create-preset.dto");
const update_preset_dto_1 = require("./dto/update-preset.dto");
let PresetsController = class PresetsController {
    constructor(presetsService) {
        this.presetsService = presetsService;
    }
    create(createPresetDto) {
        return this.presetsService.create(createPresetDto);
    }
    findAll(search, type) {
        return this.presetsService.findAll(search, type);
    }
    getStatistics() {
        return this.presetsService.getStatistics();
    }
    findByStack(stackId) {
        return this.presetsService.findByStack(stackId);
    }
    findOne(id) {
        return this.presetsService.findOne(id);
    }
    update(id, updatePresetDto) {
        return this.presetsService.update(id, updatePresetDto);
    }
    remove(id) {
        return this.presetsService.remove(id);
    }
    getTags() {
        return this.presetsService.getAllTags();
    }
    addTag(tag) {
        return this.presetsService.addTag(tag);
    }
    removeTag(tag) {
        return this.presetsService.removeTag(tag);
    }
};
exports.PresetsController = PresetsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Criar um novo preset' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_preset_dto_1.CreatePresetDto]),
    __metadata("design:returntype", void 0)
], PresetsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar todos os presets' }),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PresetsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, swagger_1.ApiOperation)({ summary: 'Obter estatísticas dos presets' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PresetsController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)('stack/:stackId'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar presets de uma stack específica' }),
    __param(0, (0, common_1.Param)('stackId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PresetsController.prototype, "findByStack", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar um preset por ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PresetsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar um preset' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_preset_dto_1.UpdatePresetDto]),
    __metadata("design:returntype", void 0)
], PresetsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Deletar um preset' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PresetsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('tags/list'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar todas as tags únicas' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PresetsController.prototype, "getTags", null);
__decorate([
    (0, common_1.Post)('tags'),
    (0, swagger_1.ApiOperation)({ summary: 'Adicionar uma nova tag' }),
    __param(0, (0, common_1.Body)('tag')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PresetsController.prototype, "addTag", null);
__decorate([
    (0, common_1.Delete)('tags/:tag'),
    (0, swagger_1.ApiOperation)({ summary: 'Remover uma tag' }),
    __param(0, (0, common_1.Param)('tag')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PresetsController.prototype, "removeTag", null);
exports.PresetsController = PresetsController = __decorate([
    (0, swagger_1.ApiTags)('Presets'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('presets'),
    __metadata("design:paramtypes", [presets_service_1.PresetsService])
], PresetsController);
//# sourceMappingURL=presets.controller.js.map