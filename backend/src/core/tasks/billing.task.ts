import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { BillingService } from '../billing.service';

@Injectable()
export class BillingTask {
  private readonly logger = new Logger(BillingTask.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
  ) {}

  // Roda todo dia 1º do mês às 02:00 — Gera faturas
  @Cron('0 2 1 * *')
  async generateMonthlyInvoices() {
    this.logger.log('Iniciando geração de faturas do mês...');
    const count = await this.billing.generateAllInvoices();
    this.logger.log(`Geração concluída: ${count} faturas criadas.`);
  }

  // Roda todo dia às 03:00 — Tenta cobrar faturas pendentes
  @Cron('0 3 * * *')
  async chargePendingInvoices() {
    this.logger.log('Iniciando cobrança de faturas pendentes...');

    const pendingInvoices = await this.prisma.client.systemInvoice.findMany({
      where: {
        status: 'PENDENTE',
        attemptCount: { lt: 5 }, // Máx 5 tentativas
      },
      orderBy: { dueDate: 'asc' },
      take: 100,
    });

    let charged = 0;
    for (const inv of pendingInvoices) {
      try {
        const result = await this.billing.processInvoicePayment(inv.id);
        if (result.status === 'approved' || result.status === 'in_process') {
          charged++;
        }
      } catch (err) {
        this.logger.warn(`Erro ao cobrar fatura ${inv.id}:`, err);
        continue;
      }
    }

    this.logger.log(`Cobranças processadas: ${charged}/${pendingInvoices.length}`);
  }

  // Roda todo dia às 04:00 — Sincroniza pagamentos pendentes no gateway
  @Cron('0 4 * * *')
  async syncGatewayPayments() {
    this.logger.log('Sincronizando pagamentos com gateway...');
    const confirmed = await this.billing.syncPendingPayments();
    this.logger.log(`Sincronização concluída: ${confirmed} pagamentos confirmados.`);
  }

  // Roda todo dia às 05:00 — Suspende hotéis inadimplentes (>5 dias)
  @Cron('0 5 * * *')
  async checkOverdueSubscriptions() {
    this.logger.log('Iniciando verificação de faturamentos atrasados...');
    const suspended = await this.billing.suspendOverdueHotels(5);
    if (suspended > 0) {
      this.logger.warn(`${suspended} hotéis suspensos por inadimplência.`);
    } else {
      this.logger.log('Nenhum hotel inadimplente encontrado.');
    }
  }

  // Roda todo dia 1º de cada mês às 06:00 — Aplica downgrades agendados
  @Cron('0 6 1 * *')
  async applyDowngrades() {
    this.logger.log('Aplicando downgrades agendados...');
    const count = await this.billing.applyScheduledDowngrades();
    this.logger.log(`${count} downgrades aplicados.`);
  }

}
