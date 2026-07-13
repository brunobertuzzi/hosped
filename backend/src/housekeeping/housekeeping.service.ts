import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../core/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, CleaningStatus, RoomStatus } from '@prisma/client';

@Injectable()
export class HousekeepingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll() {
    return this.prisma.client.cleaningTask.findMany({
      include: {
        room: { select: { numero: true, status: true, branchId: true } },
        responsavel: { select: { nome: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: { roomId: string; tipoLimpeza: string; observacoes?: string; responsavelId?: string }, userId?: string) {
    const room = await this.prisma.client.room.findUnique({ where: { id: data.roomId } });
    if (!room) throw new NotFoundException('Quarto não encontrado');

    const created = await this.prisma.client.cleaningTask.create({
      data: {
        roomId: data.roomId,
        tipoLimpeza: data.tipoLimpeza,
        observacoes: data.observacoes,
        responsavelId: data.responsavelId,
        status: CleaningStatus.PENDENTE,
      },
      include: {
        room: { select: { numero: true, status: true, branchId: true } },
        responsavel: { select: { nome: true, email: true } },
      },
    });

    await this.audit.log(userId, AuditAction.CRIAR, 'CLEANING_TASK', null, created);
    return created;
  }

  async updateStatus(id: string, status: CleaningStatus, userId?: string) {
    const task = await this.prisma.client.cleaningTask.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Tarefa de limpeza não encontrada');

    const previous = { ...task };
    const updateData: any = { status };

    if (status === CleaningStatus.EM_ANDAMENTO && !task.iniciadaEm) {
      updateData.iniciadaEm = new Date();
    }
    if (status === CleaningStatus.CONCLUIDO) {
      updateData.finalizadaEm = new Date();
    }

    const updated = await this.prisma.client.cleaningTask.update({
      where: { id },
      data: updateData,
      include: {
        room: { select: { numero: true, status: true, branchId: true } },
        responsavel: { select: { nome: true, email: true } },
      },
    });

    await this.audit.log(userId, AuditAction.MUDANCA_STATUS, 'CLEANING_TASK', previous, updated);

    // Se a tarefa foi concluída e o quarto está em LIMPEZA, atualiza para DISPONIVEL
    if (status === CleaningStatus.CONCLUIDO) {
      const room = await this.prisma.client.room.findUnique({ where: { id: task.roomId } });
      if (room && room.status === RoomStatus.LIMPEZA) {
        await this.prisma.client.room.update({
          where: { id: task.roomId },
          data: { status: RoomStatus.DISPONIVEL },
        });
      }
    }

    return updated;
  }

  async remove(id: string, userId?: string) {
    const task = await this.prisma.client.cleaningTask.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Tarefa de limpeza não encontrada');

    const deleted = await this.prisma.client.cleaningTask.delete({ where: { id } });
    await this.audit.log(userId, AuditAction.DELETAR, 'CLEANING_TASK', task, deleted);
    return deleted;
  }
}
