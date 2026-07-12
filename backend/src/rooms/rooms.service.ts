import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../core/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RoomStatus, MaintenanceStatus, AuditAction } from '@prisma/client';
import { TenantService } from '../core/tenant.service';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly tenantService: TenantService,
  ) {}

  /**
   * Retorna todos os quartos físicos
   */
  async findAllRooms() {
    return this.prisma.client.room.findMany({
      include: { category: true, branch: true },
      orderBy: { numero: 'asc' },
    });
  }

  async createRoom(data: any, branchId: string, userId?: string) {
    const context = this.tenantService.getContext();
    if (context && context.hotelId) {
      const hotel = await this.prisma.client.hotel.findUnique({
        where: { id: context.hotelId },
      });
      if (hotel) {
        const systemPlan = await this.prisma.client.systemPlan.findUnique({
          where: { name: hotel.plan },
        });

        if (systemPlan && systemPlan.maxRooms !== -1) {
          const roomCount = await this.prisma.client.room.count();
          if (roomCount >= systemPlan.maxRooms) {
            throw new BadRequestException(
              `Limite do plano ${hotel.plan} atingido (Máximo ${systemPlan.maxRooms} quartos). Faça upgrade para adicionar mais quartos.`,
            );
          }
        }
      }
    }

    const created = await this.prisma.client.room.create({
      data: {
        ...data,
        branchId,
      },
    });
    await this.audit.log(userId, AuditAction.CRIAR, 'ROOM', null, created);
    return created;
  }

  /**
   * Retorna todas as categorias de quarto
   */
  async findAllCategories() {
    return this.prisma.client.roomCategory.findMany({
      orderBy: { nome: 'asc' },
    });
  }

  async createCategory(data: any, userId?: string) {
    const created = await this.prisma.client.roomCategory.create({
      data,
    });
    await this.audit.log(
      userId,
      AuditAction.CRIAR,
      'ROOM_CATEGORY',
      null,
      created,
    );
    return created;
  }

  /**
   * Cria uma nova ordem de manutenção para um quarto físico
   */
  async createMaintenanceOrder(
    roomId: string,
    descricao: string,
    userId?: string,
  ) {
    return this.prisma.client.$transaction(async (tx: any) => {
      // 1. Buscar o quarto
      const room = await tx.room.findUnique({ where: { id: roomId } });
      if (!room) {
        throw new NotFoundException('Quarto físico não encontrado.');
      }

      if (room.status === RoomStatus.OCUPADO) {
        throw new BadRequestException(
          'Não é possível colocar um quarto ocupado em manutenção.',
        );
      }

      // 2. Atualizar status do quarto para MANUTENCAO
      const previousRoom = { ...room };
      const updatedRoom = await tx.room.update({
        where: { id: roomId },
        data: { status: RoomStatus.MANUTENCAO },
      });

      // Auditar alteração do quarto
      await this.audit.log(
        userId,
        AuditAction.MUDANCA_STATUS,
        'ROOM',
        previousRoom,
        updatedRoom,
      );

      // 3. Criar ordem de manutenção
      const maintenanceOrder = await tx.maintenanceOrder.create({
        data: {
          roomId,
          descricao,
          status: MaintenanceStatus.ABERTA,
        },
      });

      // Auditar criação da ordem
      await this.audit.log(
        userId,
        AuditAction.CRIAR,
        'MAINTENANCE_ORDER',
        null,
        maintenanceOrder,
      );

      return maintenanceOrder;
    });
  }

  /**
   * Conclui uma ordem de manutenção de quarto físico
   */
  async completeMaintenanceOrder(
    id: string,
    observacoes?: string,
    userId?: string,
  ) {
    return this.prisma.client.$transaction(async (tx: any) => {
      // 1. Buscar ordem
      const order = await tx.maintenanceOrder.findUnique({ where: { id } });
      if (!order) {
        throw new NotFoundException('Ordem de manutenção não encontrada.');
      }

      if (order.status === MaintenanceStatus.CONCLUIDA) {
        throw new BadRequestException(
          'Esta ordem de manutenção já está concluída.',
        );
      }

      // 2. Concluir ordem
      const previousOrder = { ...order };
      const updatedOrder = await tx.maintenanceOrder.update({
        where: { id },
        data: {
          status: MaintenanceStatus.CONCLUIDA,
          observacoes,
        },
      });

      // Auditar alteração da ordem
      await this.audit.log(
        userId,
        AuditAction.MUDANCA_STATUS,
        'MAINTENANCE_ORDER',
        previousOrder,
        updatedOrder,
      );

      // 3. Atualizar quarto físico para LIMPEZA apenas se não houver outras manutenções abertas
      const room = await tx.room.findUnique({ where: { id: order.roomId } });

      const otherActiveOrders = await tx.maintenanceOrder.count({
        where: {
          roomId: order.roomId,
          status: { not: MaintenanceStatus.CONCLUIDA },
          id: { not: id }, // exclui a que acabamos de concluir
        },
      });

      if (room && otherActiveOrders === 0) {
        const previousRoom = { ...room };
        const updatedRoom = await tx.room.update({
          where: { id: order.roomId },
          data: { status: RoomStatus.LIMPEZA },
        });

        // Auditar alteração do quarto
        await this.audit.log(
          userId,
          AuditAction.MUDANCA_STATUS,
          'ROOM',
          previousRoom,
          updatedRoom,
        );
      }

      return updatedOrder;
    });
  }

  /**
   * Conclui o processo de limpeza (Housekeeping) de um quarto vago, tornando-o Disponível
   */
  async completeCleaning(roomId: string, userId?: string) {
    return this.prisma.client.$transaction(async (tx: any) => {
      const room = await tx.room.findUnique({ where: { id: roomId } });
      if (!room) {
        throw new NotFoundException('Quarto físico não encontrado.');
      }

      if (room.status !== RoomStatus.LIMPEZA) {
        throw new BadRequestException(
          'Somente quartos em status de LIMPEZA podem ser liberados para DISPONÍVEL.',
        );
      }

      const previousRoom = { ...room };
      const updatedRoom = await tx.room.update({
        where: { id: roomId },
        data: { status: RoomStatus.DISPONIVEL },
      });

      // Auditar liberação da limpeza
      await this.audit.log(
        userId,
        AuditAction.MUDANCA_STATUS,
        'ROOM',
        previousRoom,
        updatedRoom,
      );

      return updatedRoom;
    });
  }

  /**
   * Retorna ordens de manutenção ativas
   */
  async findActiveMaintenance() {
    return this.prisma.client.maintenanceOrder.findMany({
      where: {
        status: { not: MaintenanceStatus.CONCLUIDA },
      },
      include: { room: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateRoom(id: string, data: any, userId?: string) {
    const prev = await this.prisma.client.room.findUnique({ where: { id } });
    if (!prev) throw new NotFoundException('Quarto não encontrado');
    const updated = await this.prisma.client.room.update({
      where: { id },
      data,
    });
    await this.audit.log(
      userId,
      AuditAction.MUDANCA_STATUS,
      'ROOM',
      prev,
      updated,
    );
    return updated;
  }

  async removeRoom(id: string, userId?: string) {
    const prev = await this.prisma.client.room.findUnique({ where: { id } });
    if (!prev) throw new NotFoundException('Quarto não encontrado');
    const deleted = await this.prisma.client.room.delete({ where: { id } });
    await this.audit.log(userId, AuditAction.DELETAR, 'ROOM', prev, deleted);
    return deleted;
  }

  async updateMaintenance(id: string, data: any, userId?: string) {
    const prev = await this.prisma.client.maintenanceOrder.findUnique({
      where: { id },
    });
    if (!prev) throw new NotFoundException('Manutenção não encontrada');
    const updated = await this.prisma.client.maintenanceOrder.update({
      where: { id },
      data,
    });
    await this.audit.log(
      userId,
      AuditAction.MUDANCA_STATUS,
      'MAINTENANCE_ORDER',
      prev,
      updated,
    );
    return updated;
  }

  async removeMaintenance(id: string, userId?: string) {
    const prev = await this.prisma.client.maintenanceOrder.findUnique({
      where: { id },
    });
    if (!prev) throw new NotFoundException('Manutenção não encontrada');
    const deleted = await this.prisma.client.maintenanceOrder.delete({
      where: { id },
    });
    await this.audit.log(
      userId,
      AuditAction.DELETAR,
      'MAINTENANCE_ORDER',
      prev,
      deleted,
    );
    return deleted;
  }
}
