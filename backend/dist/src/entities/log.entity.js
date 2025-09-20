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
exports.Log = exports.LogStatus = exports.LogType = void 0;
const typeorm_1 = require("typeorm");
var LogType;
(function (LogType) {
    LogType["DEPLOYMENT"] = "deployment";
    LogType["SSL_RENEWAL"] = "ssl_renewal";
    LogType["NGINX_RELOAD"] = "nginx_reload";
    LogType["TRAEFIK_RELOAD"] = "traefik_reload";
    LogType["SYSTEM"] = "system";
})(LogType || (exports.LogType = LogType = {}));
var LogStatus;
(function (LogStatus) {
    LogStatus["SUCCESS"] = "success";
    LogStatus["FAILED"] = "failed";
    LogStatus["RUNNING"] = "running";
    LogStatus["PENDING"] = "pending";
})(LogStatus || (exports.LogStatus = LogStatus = {}));
let Log = class Log {
};
exports.Log = Log;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Log.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: LogType,
    }),
    __metadata("design:type", String)
], Log.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: LogStatus,
        default: LogStatus.PENDING,
    }),
    __metadata("design:type", String)
], Log.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Log.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], Log.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], Log.prototype, "details", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Log.prototype, "duration", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Log.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Log.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Log.prototype, "createdAt", void 0);
exports.Log = Log = __decorate([
    (0, typeorm_1.Entity)('logs')
], Log);
//# sourceMappingURL=log.entity.js.map