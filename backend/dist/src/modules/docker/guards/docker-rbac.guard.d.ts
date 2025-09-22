import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export declare enum DockerPermission {
    VIEWER = "viewer",
    OPERATOR = "operator",
    ADMIN = "admin"
}
export declare const RequireDockerPermission: import("@nestjs/core").ReflectableDecorator<DockerPermission, DockerPermission>;
export declare class DockerRbacGuard implements CanActivate {
    private reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private getUserDockerPermission;
    private hasPermission;
}
