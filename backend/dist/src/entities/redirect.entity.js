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
exports.Redirect = exports.RedirectType = void 0;
const typeorm_1 = require("typeorm");
const domain_entity_1 = require("./domain.entity");
var RedirectType;
(function (RedirectType) {
    RedirectType["PERMANENT"] = "301";
    RedirectType["TEMPORARY"] = "302";
})(RedirectType || (exports.RedirectType = RedirectType = {}));
let Redirect = class Redirect {
};
exports.Redirect = Redirect;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Redirect.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Redirect.prototype, "sourcePattern", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Redirect.prototype, "targetUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: RedirectType,
        default: RedirectType.PERMANENT,
    }),
    __metadata("design:type", String)
], Redirect.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Redirect.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Number)
], Redirect.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Redirect.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => domain_entity_1.Domain, (domain) => domain.redirects, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'domainId' }),
    __metadata("design:type", domain_entity_1.Domain)
], Redirect.prototype, "domain", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Redirect.prototype, "domainId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Redirect.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Redirect.prototype, "updatedAt", void 0);
exports.Redirect = Redirect = __decorate([
    (0, typeorm_1.Entity)('redirects')
], Redirect);
//# sourceMappingURL=redirect.entity.js.map