import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../core/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, ExpenseStatus } from '@prisma/client';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll() {
    return this.prisma.client.expense.findMany({
      orderBy: { dataVencimento: 'desc' },
    });
  }

  async create(data: {
    descricao: string;
    valor: number;
    dataVencimento: string;
    categoria: string;
    fornecedor?: string;
  }, userId?: string) {
    const created = await this.prisma.client.expense.create({
      data: {
        descricao: data.descricao,
        valor: data.valor,
        dataVencimento: new Date(data.dataVencimento),
        categoria: data.categoria,
        fornecedor: data.fornecedor,
        status: ExpenseStatus.PENDENTE,
      },
    });

    await this.audit.log(userId, AuditAction.CRIAR, 'EXPENSE', null, created);
    return created;
  }

  async update(id: string, data: Partial<{
    descricao: string;
    valor: number;
    dataVencimento: string;
    dataPagamento: string;
    categoria: string;
    fornecedor: string;
    status: ExpenseStatus;
  }>, userId?: string) {
    const prev = await this.prisma.client.expense.findUnique({ where: { id } });
    if (!prev) throw new NotFoundException('Despesa não encontrada');

    const updateData: any = { ...data };
    if (data.dataVencimento) updateData.dataVencimento = new Date(data.dataVencimento);
    if (data.dataPagamento) updateData.dataPagamento = new Date(data.dataPagamento);

    const updated = await this.prisma.client.expense.update({
      where: { id },
      data: updateData,
    });

    await this.audit.log(userId, AuditAction.MUDANCA_STATUS, 'EXPENSE', prev, updated);
    return updated;
  }

  async updateStatus(id: string, status: ExpenseStatus, userId?: string) {
    const prev = await this.prisma.client.expense.findUnique({ where: { id } });
    if (!prev) throw new NotFoundException('Despesa não encontrada');

    const updateData: any = { status };
    if (status === ExpenseStatus.PAGO && !prev.dataPagamento) {
      updateData.dataPagamento = new Date();
    }

    const updated = await this.prisma.client.expense.update({
      where: { id },
      data: updateData,
    });

    await this.audit.log(userId, AuditAction.MUDANCA_STATUS, 'EXPENSE', prev, updated);
    return updated;
  }

  async remove(id: string, userId?: string) {
    const prev = await this.prisma.client.expense.findUnique({ where: { id } });
    if (!prev) throw new NotFoundException('Despesa não encontrada');

    const deleted = await this.prisma.client.expense.delete({ where: { id } });
    await this.audit.log(userId, AuditAction.DELETAR, 'EXPENSE', prev, deleted);
    return deleted;
  }
}
