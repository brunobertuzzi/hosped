import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';

@Injectable()
export class BillingTask {
  private readonly logger = new Logger(BillingTask.name);

  constructor(private readonly prisma: PrismaService) {}

  // Roda todo dia às 03:00 da manhã
  @Cron('0 3 * * *')
  async checkOverdueSubscriptions() {
    this.logger.log(
      'Iniciando verificação diária de faturamentos atrasados...',
    );

    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    try {
      // Busca hotéis ativos cuja data de próximo faturamento venceu há mais de 5 dias
      const overdueHotels = await this.prisma.client.hotel.findMany({
        where: {
          status: 'ACTIVE',
          nextBillingDate: {
            lt: fiveDaysAgo,
          },
        },
      });

      if (overdueHotels.length === 0) {
        this.logger.log(
          'Nenhum hotel com mensalidade atrasada por mais de 5 dias.',
        );
        return;
      }

      this.logger.warn(
        `Encontrados ${overdueHotels.length} hotéis inadimplentes. Suspendendo contas...`,
      );

      for (const hotel of overdueHotels) {
        await this.prisma.client.hotel.update({
          where: { id: hotel.id },
          data: { status: 'SUSPENDED' },
        });

        // Registrar no log de auditoria do sistema
        await this.prisma.client.auditLog.create({
          data: {
            hotelId: hotel.id,
            acao: 'MUDANCA_STATUS',
            entidade: 'HOTEL_SUBSCRIPTION',
            dadosAnteriores: { status: 'ACTIVE' },
            dadosNovos: {
              status: 'SUSPENDED',
              reason: 'Faturamento atrasado > 5 dias',
            },
          },
        });

        this.logger.warn(
          `Hotel ${hotel.nome} (${hotel.id}) suspenso por inadimplência.`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Erro ao processar verificador de faturamentos:',
        error,
      );
    }
  }
}
