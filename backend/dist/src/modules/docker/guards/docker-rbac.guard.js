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
exports.DockerRbacGuard = exports.RequireDockerPermission = exports.DockerPermission = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
var DockerPermission;
(function (DockerPermission) {
    DockerPermission["VIEWER"] = "viewer";
    DockerPermission["OPERATOR"] = "operator";
    DockerPermission["ADMIN"] = "admin";
})(DockerPermission || (exports.DockerPermission = DockerPermission = {}));
exports.RequireDockerPermission = core_1.Reflector.createDecorator();
let DockerRbacGuard = class DockerRbacGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    async canActivate(context) {
        const requiredPermission = this.reflector.get(exports.RequireDockerPermission, context.getHandler());
        if (!requiredPermission) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            return false;
        }
        const userPermission = this.getUserDockerPermission(user);
        if (!this.hasPermission(userPermission, requiredPermission)) {
            throw new common_1.ForbiddenException(`Docker ${requiredPermission} permission required`);
        }
        return true;
    }
    getUserDockerPermission(user) {
        if (user.role === 'admin' || user.role === 'super_admin') {
            return DockerPermission.ADMIN;
        }
        if (user.role === 'operator' || user.role === 'manager') {
            return DockerPermission.OPERATOR;
        }
        return DockerPermission.VIEWER;
    }
    hasPermission(userPermission, requiredPermission) {
        const permissionHierarchy = {
            [DockerPermission.VIEWER]: 1,
            [DockerPermission.OPERATOR]: 2,
            [DockerPermission.ADMIN]: 3
        };
        return permissionHierarchy[userPermission] >= permissionHierarchy[requiredPermission];
    }
};
exports.DockerRbacGuard = DockerRbacGuard;
exports.DockerRbacGuard = DockerRbacGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], DockerRbacGuard);
//# sourceMappingURL=docker-rbac.guard.js.map