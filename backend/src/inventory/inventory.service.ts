import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../core/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, MovementType } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Retorna todos os itens de estoque
   */
  async findAll() {
    return this.prisma.client.inventoryItem.findMany({
      orderBy: { nome: 'asc' },
    });
  }

  async create(data: any, branchId: string, userId?: string) {
    const created = await this.prisma.client.inventoryItem.create({
      data: {
        ...data,
        branchId,
      },
    });
    await this.audit.log(userId, AuditAction.CRIAR, 'INVENTORY', null, created);
    return created;
  }

  async update(id: string, data: any, userId?: string) {
    const prev = await this.prisma.client.inventoryItem.findUnique({
      where: { id },
    });
    if (!prev) throw new NotFoundException('Item não encontrado');

    return this.prisma.client.$transaction(async (tx: any) => {
      const updated = await tx.inventoryItem.update({
        where: { id },
        data,
      });

      if (
        data.quantidade !== undefined &&
        data.quantidade !== prev.quantidade
      ) {
        const diff = data.quantidade - prev.quantidade;
        await tx.inventoryMovement.create({
          data: {
            itemId: id,
            hotelId: prev.hotelId,
            tipo: diff > 0 ? MovementType.ENTRADA : MovementType.SAIDA,
            quantidade: Math.abs(diff),
            motivo: diff > 0 ? 'COMPRA_ESTOQUE / AJUSTE' : 'AJUSTE',
          },
        });
      }

      await this.audit.log(
        userId,
        AuditAction.MUDANCA_STATUS,
        'INVENTORY',
        prev,
        updated,
      );
      return updated;
    });
  }

  async remove(id: string, userId?: string) {
    const prev = await this.prisma.client.inventoryItem.findUnique({
      where: { id },
    });
    if (!prev) throw new NotFoundException('Item não encontrado');
    const deleted = await this.prisma.client.inventoryItem.delete({
      where: { id },
    });
    await this.audit.log(
      userId,
      AuditAction.DELETAR,
      'INVENTORY',
      prev,
      deleted,
    );
    return deleted;
  }
}
