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
exports.SslCertificatesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const ssl_certificates_service_1 = require("./ssl-certificates.service");
const ssl_certificate_dto_1 = require("../../dtos/ssl-certificate.dto");
const jwt_auth_guard_1 = require("../../guards/jwt-auth.guard");
let SslCertificatesController = class SslCertificatesController {
    constructor(sslCertificatesService) {
        this.sslCertificatesService = sslCertificatesService;
    }
    create(createSslCertificateDto) {
        return this.sslCertificatesService.create(createSslCertificateDto);
    }
    findAll() {
        return this.sslCertificatesService.findAll();
    }
    getStats() {
        return this.sslCertificatesService.getStats();
    }
    renewExpired() {
        return this.sslCertificatesService.renewExpiredCertificates();
    }
    renewCertificate(id) {
        return this.sslCertificatesService.renewCertificate(id);
    }
    findOne(id) {
        return this.sslCertificatesService.findOne(id);
    }
    update(id, updateSslCertificateDto) {
        return this.sslCertificatesService.update(id, updateSslCertificateDto);
    }
    remove(id) {
        return this.sslCertificatesService.remove(id);
    }
};
exports.SslCertificatesController = SslCertificatesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Criar novo certificado SSL' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ssl_certificate_dto_1.CreateSslCertificateDto]),
    __metadata("design:returntype", void 0)
], SslCertificatesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar todos os certificados SSL' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SslCertificatesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Obter estatísticas dos certificados' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SslCertificatesController.prototype, "getStats", null);
__decorate([
    (0, common_1.Post)('renew-expired'),
    (0, swagger_1.ApiOperation)({ summary: 'Renovar certificados expirados' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SslCertificatesController.prototype, "renewExpired", null);
__decorate([
    (0, common_1.Post)(':id/renew'),
    (0, swagger_1.ApiOperation)({ summary: 'Renovar certificado específico' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SslCertificatesController.prototype, "renewCertificate", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obter certificado SSL por ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SslCertificatesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar certificado SSL' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ssl_certificate_dto_1.UpdateSslCertificateDto]),
    __metadata("design:returntype", void 0)
], SslCertificatesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Remover certificado SSL' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SslCertificatesController.prototype, "remove", null);
exports.SslCertificatesController = SslCertificatesController = __decorate([
    (0, swagger_1.ApiTags)('ssl-certificates'),
    (0, common_1.Controller)('ssl-certificates'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [ssl_certificates_service_1.SslCertificatesService])
], SslCertificatesController);
//# sourceMappingURL=ssl-certificates.controller.js.map