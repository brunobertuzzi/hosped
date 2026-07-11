import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../core/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class GuestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(page?: number, limit?: number) {
    if (page && limit) {
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.prisma.client.guest.findMany({
          skip,
          take: limit,
          orderBy: { nome: 'asc' },
        }),
        this.prisma.client.guest.count(),
      ]);
      return { data, total, page, totalPages: Math.ceil(total / limit) };
    }
    return this.prisma.client.guest.findMany({
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string) {
    const guest = await this.prisma.client.guest.findUnique({ where: { id } });
    if (!guest) throw new NotFoundException('Hóspede não encontrado');
    return guest;
  }

  async update(id: string, data: any, userId?: string) {
    const previous = await this.findOne(id);
    const updated = await this.prisma.client.guest.update({
      where: { id },
      data,
    });

    await this.audit.log(
      userId,
      AuditAction.MUDANCA_STATUS,
      'GUEST',
      previous,
      updated,
    );
    return updated;
  }

  async remove(id: string, userId?: string) {
    const previous = await this.findOne(id);
    const deleted = await this.prisma.client.guest.delete({ where: { id } });
    await this.audit.log(
      userId,
      AuditAction.DELETAR,
      'GUEST',
      previous,
      deleted,
    );
    return deleted;
  }
}
