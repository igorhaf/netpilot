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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateContainerDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class VolumeMount {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VolumeMount.prototype, "source", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VolumeMount.prototype, "target", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['bind', 'volume']),
    __metadata("design:type", String)
], VolumeMount.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], VolumeMount.prototype, "readonly", void 0);
class PortBinding {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PortBinding.prototype, "HostPort", void 0);
class CreateContainerDto {
    constructor() {
        this.restart_policy = 'no';
    }
}
exports.CreateContainerDto = CreateContainerDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/, {
        message: 'Nome deve conter apenas letras, números, underscore, ponto e hífen'
    }),
    __metadata("design:type", String)
], CreateContainerDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateContainerDto.prototype, "image", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateContainerDto.prototype, "env", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateContainerDto.prototype, "ports", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => VolumeMount),
    __metadata("design:type", Array)
], CreateContainerDto.prototype, "volumes", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateContainerDto.prototype, "networks", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['no', 'always', 'unless-stopped', 'on-failure']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateContainerDto.prototype, "restart_policy", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateContainerDto.prototype, "labels", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateContainerDto.prototype, "command", void 0);
//# sourceMappingURL=create-container.dto.js.map