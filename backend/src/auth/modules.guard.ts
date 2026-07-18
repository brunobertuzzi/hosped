import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MODULES_KEY } from './modules.decorator';
import { PrismaService } from '../core/prisma.service';

// Lista de módulos base que são sempre permitidos independentemente do plano
// Deve estar em sincronia com DEFAULT_MODULES do frontend
const DEFAULT_MODULES = [
  'DASHBOARD',
  'RESERVATIONS',
  'GUESTS',
  'ROOMS',
  'HOUSEKEEPING',
  'MAINTENANCE',
  'INVENTORY',
  'FINANCIAL',
  'AUDIT_LOG',
];

@Injectable()
export class ModulesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModules = this.reflector.getAllAndOverride<string[]>(MODULES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredModules || requiredModules.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Se não tiver usuário logado, barra (embora AuthGuard já deva ter pego)
    if (!user) {
      throw new ForbiddenException('Usuário não autenticado.');
    }

    // Platform owners bypass module checks
    if (user.role === 'PLATFORM_OWNER') {
      return true;
    }

    if (!user.hotelId) {
      throw new ForbiddenException('Usuário não associado a um hotel.');
    }

    // Busca o hotel no banco para ter a versão mais atualizada dos enabledModules
    const hotel = await this.prisma.client.hotel.findUnique({
      where: { id: user.hotelId },
      select: { enabledModules: true },
    });

    if (!hotel) {
      throw new ForbiddenException('Hotel não encontrado.');
    }

    const enabledModules = hotel.enabledModules || [];

    // Checa se o hotel tem TODOS os módulos requeridos pela rota
    const hasAllRequiredModules = requiredModules.every(
      (mod) => DEFAULT_MODULES.includes(mod) || enabledModules.includes(mod)
    );

    if (!hasAllRequiredModules) {
      throw new ForbiddenException(
        `Acesso negado. Seu plano atual não possui acesso aos módulos necessários: ${requiredModules.join(', ')}`
      );
    }

    return true;
  }
}
