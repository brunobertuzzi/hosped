import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../core/prisma.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, user, body, params, query } = req;

    // Apenas intercepta ações de mutação
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      return next.handle().pipe(
        tap(async (data) => {
          if (!user || !user.id || !user.hotelId) return;

          let acao: AuditAction = AuditAction.ATUALIZAR;
          if (method === 'POST') acao = AuditAction.CRIAR;
          if (method === 'DELETE') acao = AuditAction.DELETAR;
          
          let entidade = 'DESCONHECIDA';
          if (url.includes('reservations')) entidade = 'RESERVA';
          if (url.includes('rooms')) entidade = 'QUARTO';
          if (url.includes('payments')) entidade = 'PAGAMENTO';
          if (url.includes('tenants') || url.includes('settings')) entidade = 'TENANT_SETTINGS';
          if (url.includes('auth/login')) {
            acao = AuditAction.LOGIN;
            entidade = 'AUTH';
          }

          try {
            await this.prisma.client.auditLog.create({
              data: {
                acao,
                entidade,
                dadosAnteriores: params || query || {},
                dadosNovos: body || {},
                userId: user.id,
                hotelId: user.hotelId,
              },
            });
          } catch (e) {
            console.error('Falha ao registrar Audit Log:', e);
          }
        }),
      );
    }

    return next.handle();
  }
}
