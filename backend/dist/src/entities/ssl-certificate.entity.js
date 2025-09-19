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
exports.SslCertificate = exports.CertificateStatus = void 0;
const typeorm_1 = require("typeorm");
const domain_entity_1 = require("./domain.entity");
var CertificateStatus;
(function (CertificateStatus) {
    CertificateStatus["VALID"] = "valid";
    CertificateStatus["EXPIRING"] = "expiring";
    CertificateStatus["EXPIRED"] = "expired";
    CertificateStatus["PENDING"] = "pending";
    CertificateStatus["FAILED"] = "failed";
})(CertificateStatus || (exports.CertificateStatus = CertificateStatus = {}));
let SslCertificate = class SslCertificate {
};
exports.SslCertificate = SslCertificate;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SslCertificate.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SslCertificate.prototype, "primaryDomain", void 0);
__decorate([
    (0, typeorm_1.Column)('simple-array', { nullable: true }),
    __metadata("design:type", Array)
], SslCertificate.prototype, "sanDomains", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: CertificateStatus,
        default: CertificateStatus.PENDING,
    }),
    __metadata("design:type", String)
], SslCertificate.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], SslCertificate.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], SslCertificate.prototype, "autoRenew", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 30 }),
    __metadata("design:type", Number)
], SslCertificate.prototype, "renewBeforeDays", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SslCertificate.prototype, "certificatePath", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SslCertificate.prototype, "privateKeyPath", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SslCertificate.prototype, "issuer", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], SslCertificate.prototype, "lastError", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => domain_entity_1.Domain, (domain) => domain.sslCertificates, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'domainId' }),
    __metadata("design:type", domain_entity_1.Domain)
], SslCertificate.prototype, "domain", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SslCertificate.prototype, "domainId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SslCertificate.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], SslCertificate.prototype, "updatedAt", void 0);
exports.SslCertificate = SslCertificate = __decorate([
    (0, typeorm_1.Entity)('ssl_certificates')
], SslCertificate);
//# sourceMappingURL=ssl-certificate.entity.js.map