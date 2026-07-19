import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../core/prisma.service';
import { TenantService } from '../core/tenant.service';

@Injectable()
export class ApiUsageInterceptor implements NestInterceptor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const hotelId = req.user?.hotelId || this.tenantService.getHotelId();

    // Só conta requisições de hotéis autenticados
    if (hotelId) {
      return next.handle().pipe(
        tap(async () => {
          try {
            await this.prisma.client.hotel.update({
              where: { id: hotelId },
              data: { apiRequestsCount: { increment: 1 } },
            });
          } catch {
            // Silencia erro para não quebrar a requisição original
          }
        }),
      );
    }

    return next.handle();
  }
}