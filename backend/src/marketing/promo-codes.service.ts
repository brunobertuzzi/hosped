import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../core/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class PromoCodesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(hotelId: string) {
    return this.prisma.client.promoCode.findMany({
      where: { hotelId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async validate(hotelId: string, code: string) {
    const promo = await this.prisma.client.promoCode.findUnique({
      where: {
        hotelId_codigo: {
          hotelId,
          codigo: code.toUpperCase(),
        },
      },
    });

    if (!promo) {
      throw new NotFoundException('Cupom inválido ou não encontrado.');
    }

    if (!promo.ativo) {
      throw new BadRequestException('Este cupom está inativo.');
    }

    if (promo.validade && new Date(promo.validade) < new Date()) {
      throw new BadRequestException('Este cupom já expirou.');
    }

    if (promo.quantidadeTotal && promo.usos >= promo.quantidadeTotal) {
      throw new BadRequestException('Este cupom esgotou.');
    }

    return promo;
  }

  async create(data: any, hotelId: string, userId?: string) {
    const existing = await this.prisma.client.promoCode.findUnique({
      where: {
        hotelId_codigo: {
          hotelId,
          codigo: data.codigo.toUpperCase(),
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Já existe um cupom com este código neste hotel.',
      );
    }

    const created = await this.prisma.client.promoCode.create({
      data: {
        hotelId,
        codigo: data.codigo.toUpperCase(),
        descricao: data.descricao,
        tipoDesconto: data.tipoDesconto,
        valorDesconto: data.valorDesconto,
        quantidadeTotal: data.quantidadeTotal,
        validade: data.validade ? new Date(data.validade) : null,
        ativo: data.ativo !== undefined ? data.ativo : true,
      },
    });

    await this.audit.log(
      userId,
      AuditAction.CRIAR,
      'PROMO_CODE',
      null,
      created,
    );
    return created;
  }

  async update(id: string, data: any, hotelId: string, userId?: string) {
    const promo = await this.prisma.client.promoCode.findFirst({
      where: { id, hotelId },
    });

    if (!promo) {
      throw new NotFoundException('Cupom não encontrado.');
    }

    if (data.codigo && data.codigo.toUpperCase() !== promo.codigo) {
      const existing = await this.prisma.client.promoCode.findUnique({
        where: {
          hotelId_codigo: {
            hotelId,
            codigo: data.codigo.toUpperCase(),
          },
        },
      });
      if (existing) {
        throw new BadRequestException(
          'Já existe um cupom com este código neste hotel.',
        );
      }
    }

    const updated = await this.prisma.client.promoCode.update({
      where: { id },
      data: {
        codigo: data.codigo ? data.codigo.toUpperCase() : undefined,
        descricao: data.descricao,
        tipoDesconto: data.tipoDesconto,
        valorDesconto: data.valorDesconto,
        quantidadeTotal: data.quantidadeTotal,
        validade: data.validade ? new Date(data.validade) : undefined,
        ativo: data.ativo,
      },
    });

    await this.audit.log(
      userId,
      AuditAction.MUDANCA_STATUS,
      'PROMO_CODE',
      promo,
      updated,
    );
    return updated;
  }

  async remove(id: string, hotelId: string, userId?: string) {
    const promo = await this.prisma.client.promoCode.findFirst({
      where: { id, hotelId },
    });

    if (!promo) {
      throw new NotFoundException('Cupom não encontrado.');
    }

    const deleted = await this.prisma.client.promoCode.delete({
      where: { id },
    });

    await this.audit.log(
      userId,
      AuditAction.DELETAR,
      'PROMO_CODE',
      promo,
      deleted,
    );
    return deleted;
  }
}
