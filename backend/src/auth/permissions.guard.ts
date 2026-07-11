import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Acesso negado. Usuário não autenticado.');
    }

    // Platform Owner tem permissão total irrestrita
    if (user.role === Role.PLATFORM_OWNER) {
      return true;
    }

    const userPermissions: string[] = user.permissions || [];

    // Se o usuário tiver a permissão coringa "*", ele tem acesso completo
    if (userPermissions.includes('*')) {
      return true;
    }

    // Verificar se o usuário possui todas as permissões exigidas
    const hasAllPermissions = requiredPermissions.every((perm) =>
      userPermissions.includes(perm),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        'Acesso negado. Você não possui a permissão requerida para esta operação.',
      );
    }

    return true;
  }
}
