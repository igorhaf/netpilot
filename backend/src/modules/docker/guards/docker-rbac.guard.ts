import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export enum DockerPermission {
  VIEWER = 'viewer',      // Read-only
  OPERATOR = 'operator',  // Non-destructive actions
  ADMIN = 'admin'         // Full access including prune/delete
}

// Decorator para definir permissões necessárias
export const RequireDockerPermission = Reflector.createDecorator<DockerPermission>();

@Injectable()
export class DockerRbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get(RequireDockerPermission, context.getHandler());

    if (!requiredPermission) {
      return true; // Se não há permissão específica requerida, permite
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Determinar permissão do usuário baseado no role
    const userPermission = this.getUserDockerPermission(user);

    if (!this.hasPermission(userPermission, requiredPermission)) {
      throw new ForbiddenException(`Docker ${requiredPermission} permission required`);
    }

    return true;
  }

  private getUserDockerPermission(user: any): DockerPermission {
    // Mapear roles do usuário para permissões Docker
    if (user.role === 'admin' || user.role === 'super_admin') {
      return DockerPermission.ADMIN;
    }

    if (user.role === 'operator' || user.role === 'manager') {
      return DockerPermission.OPERATOR;
    }

    return DockerPermission.VIEWER;
  }

  private hasPermission(userPermission: DockerPermission, requiredPermission: DockerPermission): boolean {
    const permissionHierarchy = {
      [DockerPermission.VIEWER]: 1,
      [DockerPermission.OPERATOR]: 2,
      [DockerPermission.ADMIN]: 3
    };

    return permissionHierarchy[userPermission] >= permissionHierarchy[requiredPermission];
  }
}