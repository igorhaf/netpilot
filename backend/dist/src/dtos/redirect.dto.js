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
exports.UpdateRedirectDto = exports.CreateRedirectDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const redirect_entity_1 = require("../entities/redirect.entity");
class CreateRedirectDto {
}
exports.CreateRedirectDto = CreateRedirectDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '/old-path' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRedirectDto.prototype, "sourcePattern", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'https://exemplo.com/new-path' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRedirectDto.prototype, "targetUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: redirect_entity_1.RedirectType.PERMANENT, enum: redirect_entity_1.RedirectType }),
    (0, class_validator_1.IsEnum)(redirect_entity_1.RedirectType),
    __metadata("design:type", String)
], CreateRedirectDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateRedirectDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateRedirectDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Redirecionamento para nova página', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRedirectDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-do-dominio' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateRedirectDto.prototype, "domainId", void 0);
class UpdateRedirectDto extends CreateRedirectDto {
}
exports.UpdateRedirectDto = UpdateRedirectDto;
//# sourceMappingURL=redirect.dto.js.map