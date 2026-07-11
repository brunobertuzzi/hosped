import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from './tenant.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantService: TenantService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // 1. Extrair dos headers customizados (padrão para chamadas do dashboard administrativo)
    let hotelId = req.headers['x-hotel-id'] as string;
    let branchId = req.headers['x-branch-id'] as string;

    // 2. Fallback para parâmetros de query (padrão para chamadas públicas do portal de reservas)
    if (!hotelId && req.query['hotelId']) {
      hotelId = req.query['hotelId'] as string;
    }
    if (!branchId && req.query['branchId']) {
      branchId = req.query['branchId'] as string;
    }

    // Sempre executa a requisição inteira dentro do contexto do AsyncLocalStorage
    // O AuthGuard irá sobrescrever com dados seguros caso a rota seja autenticada
    this.tenantService.run(
      {
        hotelId,
        branchId,
        userId: req.headers['x-user-id'] as string,
        role: req.headers['x-user-role'] as string,
      },
      () => {
        next();
      },
    );
  }
}
