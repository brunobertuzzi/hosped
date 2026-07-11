import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra uma ação de auditoria estruturada
   */
  async log(
    userId: string | undefined,
    acao: AuditAction,
    entidade: string,
    dadosAnteriores?: any,
    dadosNovos?: any,
  ) {
    try {
      await this.prisma.client.auditLog.create({
        data: {
          userId,
          acao,
          entidade,
          dadosAnteriores: dadosAnteriores
            ? JSON.parse(JSON.stringify(dadosAnteriores))
            : null,
          dadosNovos: dadosNovos
            ? JSON.parse(JSON.stringify(dadosNovos))
            : null,
        },
      });
    } catch (err) {
      // Registrar falha de auditoria em logs para não parar a execução principal
      console.error('Falha ao registrar log de auditoria no PostgreSQL:', err);
    }
  }
}
