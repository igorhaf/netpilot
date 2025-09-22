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
exports.DockerMinimalController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../../guards/jwt-auth.guard");
let DockerMinimalController = class DockerMinimalController {
    listContainers() {
        return {
            data: [],
            message: 'Docker containers endpoint working - implementation needed'
        };
    }
    listImages() {
        return {
            data: [],
            message: 'Docker images endpoint working - implementation needed'
        };
    }
    listVolumes() {
        return {
            data: [],
            message: 'Docker volumes endpoint working - implementation needed'
        };
    }
    listNetworks() {
        return {
            data: [],
            message: 'Docker networks endpoint working - implementation needed'
        };
    }
    listJobs() {
        return {
            data: [],
            message: 'Docker jobs endpoint working - implementation needed'
        };
    }
};
exports.DockerMinimalController = DockerMinimalController;
__decorate([
    (0, common_1.Get)('containers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DockerMinimalController.prototype, "listContainers", null);
__decorate([
    (0, common_1.Get)('images'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DockerMinimalController.prototype, "listImages", null);
__decorate([
    (0, common_1.Get)('volumes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DockerMinimalController.prototype, "listVolumes", null);
__decorate([
    (0, common_1.Get)('networks'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DockerMinimalController.prototype, "listNetworks", null);
__decorate([
    (0, common_1.Get)('jobs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DockerMinimalController.prototype, "listJobs", null);
exports.DockerMinimalController = DockerMinimalController = __decorate([
    (0, common_1.Controller)('api/docker'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)
], DockerMinimalController);
//# sourceMappingURL=docker-minimal.controller.js.map