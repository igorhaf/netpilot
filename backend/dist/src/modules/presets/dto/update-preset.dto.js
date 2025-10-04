"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePresetDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_preset_dto_1 = require("./create-preset.dto");
class UpdatePresetDto extends (0, swagger_1.PartialType)(create_preset_dto_1.CreatePresetDto) {
}
exports.UpdatePresetDto = UpdatePresetDto;
//# sourceMappingURL=update-preset.dto.js.map