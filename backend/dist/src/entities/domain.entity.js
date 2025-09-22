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
exports.Domain = void 0;
const typeorm_1 = require("typeorm");
const proxy_rule_entity_1 = require("./proxy-rule.entity");
const ssl_certificate_entity_1 = require("./ssl-certificate.entity");
let Domain = class Domain {
};
exports.Domain = Domain;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Domain.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Domain.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Domain.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Domain.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Domain.prototype, "autoTls", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Domain.prototype, "forceHttps", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Domain.prototype, "blockExternalAccess", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Domain.prototype, "enableWwwRedirect", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Domain.prototype, "bindIp", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => proxy_rule_entity_1.ProxyRule, (proxyRule) => proxyRule.domain),
    __metadata("design:type", Array)
], Domain.prototype, "proxyRules", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ssl_certificate_entity_1.SslCertificate, (certificate) => certificate.domain),
    __metadata("design:type", Array)
], Domain.prototype, "sslCertificates", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Domain.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Domain.prototype, "updatedAt", void 0);
exports.Domain = Domain = __decorate([
    (0, typeorm_1.Entity)('domains')
], Domain);
//# sourceMappingURL=domain.entity.js.map