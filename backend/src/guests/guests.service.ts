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

  async findAll(page?: number, limit?: number, hotelId?: string) {
    const where = hotelId ? { hotelId } : {};
    if (page && limit) {
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.prisma.client.guest.findMany({
          where,
          skip,
          take: limit,
          orderBy: { nome: 'asc' },
        }),
        this.prisma.client.guest.count({ where }),
      ]);
      return { data, total, page, totalPages: Math.ceil(total / limit) };
    }
    return this.prisma.client.guest.findMany({
      where,
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string) {
    const guest = await this.prisma.client.guest.findUnique({ where: { id } });
    if (!guest) throw new NotFoundException('Hóspede não encontrado');
    return guest;
  }

  async create(data: any, userId?: string, hotelId?: string) {
    const created = await this.prisma.client.guest.create({
      data: {
        ...data,
        hotelId,
      },
    });
    await this.audit.log(userId, AuditAction.CRIAR, 'GUEST', null, created);
    return created;
  }

  async update(id: string, data: any, userId?: string, hotelId?: string) {
    const previous = await this.findOne(id);
    // Ensure we only update guests belonging to this hotel
    if (hotelId && previous.hotelId !== hotelId) {
      throw new NotFoundException('Hóspede não encontrado');
    }
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
