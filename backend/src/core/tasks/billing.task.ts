import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { BillingService } from '../billing.service';

@Injectable()
export class BillingTask implements OnApplicationBootstrap {
  private readonly logger = new Logger(BillingTask.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('=== BillingTask: Executando tarefas no boot ===');
    try {
      const count = await this.billing.generateAllInvoices();
      this.logger.log(`${count} faturas geradas no boot.`);

      const charged = await this.billing.chargePendingInvoices();
      this.logger.log(`${charged} faturas cobradas no boot.`);

      const confirmed = await this.billing.syncPendingPayments();
      this.logger.log(`${confirmed} pagamentos sincronizados no boot.`);

      const suspended = await this.billing.suspendOverdueHotels(5);
      if (suspended > 0) this.logger.warn(`${suspended} hotéis suspensos no boot.`);

      const downgrades = await this.billing.applyScheduledDowngrades();
      this.logger.log(`${downgrades} downgrades aplicados no boot.`);
    } catch (err) {
      this.logger.error('Erro no billing boot:', err);
    }
  }

  // Roda todo dia às 02:00 — Gera faturas para hotéis com nextBillingDate vencido
  @Cron('0 2 * * *')
  async generateMonthlyInvoices() {
    this.logger.log('Iniciando geração de faturas...');
    const count = await this.billing.generateAllInvoices();
    this.logger.log(`Geração concluída: ${count} faturas criadas.`);
  }

  // Roda todo dia às 03:00 — Tenta cobrar faturas pendentes
  @Cron('0 3 * * *')
  async chargePendingInvoices() {
    this.logger.log('Iniciando cobrança de faturas pendentes...');
    const charged = await this.billing.chargePendingInvoices();
    this.logger.log(`Cobranças processadas: ${charged}`);
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

  // Roda todo dia às 06:00 — Aplica downgrades agendados
  @Cron('0 6 * * *')
  async applyDowngrades() {
    this.logger.log('Aplicando downgrades agendados...');
    const count = await this.billing.applyScheduledDowngrades();
    this.logger.log(`${count} downgrades aplicados.`);
  }
}
