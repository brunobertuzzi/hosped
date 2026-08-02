import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../core/prisma.service';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Gera o resumo diário do hotel: check-ins, check-outs, ocupação,
   * receitas, despesas, consumos e saldo do dia.
   */
  async getDailySummary(hotelId: string, dateStr: string) {
    // Validar data
    const date = new Date(dateStr + 'T12:00:00Z');
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Data inválida. Use o formato YYYY-MM-DD.');
    }

    const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
    const endOfDay = new Date(dateStr + 'T23:59:59.999Z');

    this.logger.log(`Gerando daily-summary para hotel ${hotelId} na data ${dateStr}`);

    // 1. Total de quartos do hotel
    const totalRooms = await this.prisma.client.room.count({
      where: { hotelId },
    });

    // 2. Quartos ocupados (status = OCUPADO)
    const occupiedRooms = await this.prisma.client.room.count({
      where: { hotelId, status: 'OCUPADO' },
    });

    // 3. Check-ins realizados no dia
    const checkInsToday = await this.prisma.client.reservation.count({
      where: {
        hotelId,
        checkInAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    // 4. Check-outs realizados no dia
    const checkOutsToday = await this.prisma.client.reservation.count({
      where: {
        hotelId,
        checkOutAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    // 5. Receita do dia (pagamentos registrados no dia, APROVADOS)
    const paymentsResult = await this.prisma.client.payment.aggregate({
      where: {
        hotelId,
        createdAt: { gte: startOfDay, lte: endOfDay },
        status: 'APROVADO',
      },
      _sum: { valor: true },
    });
    const receitaDoDia = Number(paymentsResult._sum.valor || 0);

    // 6. Despesas do dia (despesas com data de pagamento no dia)
    const expensesResult = await this.prisma.client.expense.aggregate({
      where: {
        hotelId,
        dataPagamento: { gte: startOfDay, lte: endOfDay },
        status: 'PAGO',
      },
      _sum: { valor: true },
    });
    const despesasDoDia = Number(expensesResult._sum.valor || 0);

    // 7. Saldo do dia
    const saldo = receitaDoDia - despesasDoDia;

    // 8. Consumos lançados no dia
    const consumos = await this.prisma.client.consumption.findMany({
      where: {
        hotelId,
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        reservation: {
          select: {
            id: true,
            guestId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalConsumos = consumos.reduce(
      (sum: number, c: any) => sum + Number(c.valorTotal),
      0,
    );

    return {
      data: dateStr,
      hotelId,
      checkIns: checkInsToday,
      checkOuts: checkOutsToday,
      ocupacaoAtual: occupiedRooms,
      totalQuartos: totalRooms,
      ocupacaoPercentual:
        totalRooms > 0
          ? Number(((occupiedRooms / totalRooms) * 100).toFixed(1))
          : 0,
      quartosDisponiveis: totalRooms - occupiedRooms,
      receitaDoDia,
      despesasDoDia,
      saldo,
      totalConsumos,
      consumos,
    };
  }

  /**
   * Exporta dados financeiros como CSV (ponto-e-vírgula).
   */
  async exportFinanceiroCsv(
    hotelId: string,
    startDate: string,
    endDate: string,
  ): Promise<string> {
    const start = new Date(startDate + 'T00:00:00.000Z');
    const end = new Date(endDate + 'T23:59:59.999Z');

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException(
        'Datas inválidas. Use o formato YYYY-MM-DD.',
      );
    }

    this.logger.log(
      `Exportando CSV financeiro para hotel ${hotelId} de ${startDate} a ${endDate}`,
    );

    // Pagamentos no período
    const payments = await this.prisma.client.payment.findMany({
      where: {
        hotelId,
        createdAt: { gte: start, lte: end },
        status: 'APROVADO',
      },
      include: {
        reservation: { select: { id: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Despesas no período
    const expenses = await this.prisma.client.expense.findMany({
      where: {
        hotelId,
        dataPagamento: { gte: start, lte: end },
        status: 'PAGO',
      },
      orderBy: { dataPagamento: 'asc' },
    });

    // Cabeçalho CSV (separador ;)
    const header = 'Tipo;Descrição;Valor;Data;Reserva;Método';

    const rows: string[] = [header];

    // Linhas de pagamentos (receitas)
    for (const p of payments) {
      const valor = Number(p.valor).toFixed(2).replace('.', ',');
      const data = p.createdAt.toISOString().split('T')[0];
      const reserva = p.reservation?.id || '';
      rows.push(
        `RECEITA;Pagamento ${p.metodo};${valor};${data};${reserva};${p.metodo}`,
      );
    }

    // Linhas de despesas
    for (const e of expenses) {
      const valor = Number(e.valor).toFixed(2).replace('.', ',');
      const data = e.dataPagamento
        ? e.dataPagamento.toISOString().split('T')[0]
        : '';
      // Escape aspas simples se houver vírgula/; na descrição
      const desc = e.descricao.replace(/;/g, ',');
      rows.push(`DESPESA;${desc};${valor};${data};;`);
    }

    return rows.join('\n');
  }

  /**
   * Exporta dados de reservas como CSV (separador ;).
   */
  async exportReservasCsv(
    hotelId: string,
    startDate: string,
    endDate: string,
  ): Promise<string> {
    const start = new Date(startDate + 'T00:00:00.000Z');
    const end = new Date(endDate + 'T23:59:59.999Z');

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException(
        'Datas inválidas. Use o formato YYYY-MM-DD.',
      );
    }

    this.logger.log(
      `Exportando CSV de reservas para hotel ${hotelId} de ${startDate} a ${endDate}`,
    );

    const reservations = await this.prisma.client.reservation.findMany({
      where: {
        hotelId,
        createdAt: { gte: start, lte: end },
      },
      include: {
        guest: { select: { nome: true, documento: true, email: true } },
        category: { select: { nome: true } },
        room: { select: { numero: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const header =
      'ID;Criada em;Hóspede;Documento;Email;Categoria;Quarto;Check-in;Check-out;Valor Total;Status;Origem';

    const rows: string[] = [header];

    for (const r of reservations) {
      const id = r.id;
      const criadaEm = r.createdAt.toISOString().split('T')[0];
      const hospede = (r.guest?.nome || '').replace(/;/g, ',');
      const documento = r.guest?.documento || '';
      const email = r.guest?.email || '';
      const categoria = r.category?.nome || '';
      const quarto = r.room?.numero || '';
      const checkIn = r.dataCheckIn.toISOString().split('T')[0];
      const checkOut = r.dataCheckOut.toISOString().split('T')[0];
      const valor = Number(r.valorTotal).toFixed(2).replace('.', ',');
      const status = r.status;
      const origem = r.origem;

      rows.push(
        `${id};${criadaEm};${hospede};${documento};${email};${categoria};${quarto};${checkIn};${checkOut};${valor};${status};${origem}`,
      );
    }

    return rows.join('\n');
  }
}