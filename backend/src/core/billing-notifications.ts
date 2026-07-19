import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../core/prisma.service';

@Injectable()
export class BillingNotifications {
  private readonly logger = new Logger(BillingNotifications.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('billing.payment.confirmed')
  async handlePaymentConfirmed(payload: {
    hotelId: string;
    invoiceId: string;
    amount: number;
  }) {
    this.logger.log(`Notificação: Pagamento confirmado para hotel ${payload.hotelId}`);

    const hotel = await this.prisma.client.hotel.findUnique({
      where: { id: payload.hotelId },
    });
    if (!hotel) return;

    // Tentar enviar notificação via WhatsApp se configurado
    try {
      const integration = await this.prisma.client.hotelIntegration.findUnique({
        where: { hotelId: payload.hotelId },
      });

      if (integration?.whatsappApiUrl && integration?.whatsappToken) {
        const { default: axios } = await import('axios');
        await axios.post(
          integration.whatsappApiUrl,
          {
            number: hotel.telefone,
            textMessage: {
              text: `✅ *Pagamento Confirmado!*\n\nOlá ${hotel.nome}, seu pagamento de *R$ ${payload.amount}* foi recebido com sucesso!\n\nFatura: #${payload.invoiceId.slice(0, 8)}\n\nObrigado por continuar conosco! 🏨`,
            },
          },
          {
            headers: {
              apikey: integration.whatsappToken,
              'Content-Type': 'application/json',
            },
            timeout: 5000,
          },
        );
      } else {
        this.logger.log(`WhatsApp não configurado para hotel ${payload.hotelId}. Notificação seria enviada.`);
      }
    } catch (err) {
      this.logger.warn(`Falha ao enviar notificação WhatsApp para ${payload.hotelId}:`, err);
    }

    // Registrar log
    await this.prisma.client.billingLog.create({
      data: {
        hotelId: payload.hotelId,
        event: 'PAYMENT_CONFIRMED_NOTIFICATION',
        detail: `Notificação de pagamento enviada para ${hotel.email}`,
        metadata: { invoiceId: payload.invoiceId, amount: payload.amount },
      },
    });
  }

  @OnEvent('billing.invoice.created')
  async handleInvoiceCreated(payload: {
    hotelId: string;
    invoiceId: string;
    amount: number;
    dueDate: Date;
  }) {
    this.logger.log(`Notificação: Fatura criada para hotel ${payload.hotelId}`);

    const hotel = await this.prisma.client.hotel.findUnique({
      where: { id: payload.hotelId },
      include: { integration: true },
    });
    if (!hotel) return;

    const dueStr = payload.dueDate.toLocaleDateString('pt-BR');

    // Notificar sobre nova fatura
    try {
      if (hotel.integration?.whatsappApiUrl && hotel.integration?.whatsappToken) {
        const { default: axios } = await import('axios');
        await axios.post(
          hotel.integration.whatsappApiUrl,
          {
            number: hotel.telefone,
            textMessage: {
              text: `📄 *Nova Fatura Disponível*\n\nOlá ${hotel.nome}, sua fatura de *R$ ${payload.amount}* já está disponível.\n\n📅 Vencimento: ${dueStr}\n🔢 Fatura: #${payload.invoiceId.slice(0, 8)}\n\nPara pagar, acesse o painel administrativo do seu hotel.`,
            },
          },
          {
            headers: {
              apikey: hotel.integration.whatsappToken,
              'Content-Type': 'application/json',
            },
            timeout: 5000,
          },
        );
      }
    } catch (err) {
      this.logger.warn(`Falha ao notificar fatura via WhatsApp:`, err);
    }
  }

  @OnEvent('billing.suspended')
  async handleSuspended(payload: { hotelId: string; reason: string }) {
    this.logger.warn(`Notificação: Hotel ${payload.hotelId} suspenso — ${payload.reason}`);

    const hotel = await this.prisma.client.hotel.findUnique({
      where: { id: payload.hotelId },
      include: { integration: true },
    });
    if (!hotel) return;

    try {
      if (hotel.integration?.whatsappApiUrl && hotel.integration?.whatsappToken) {
        const { default: axios } = await import('axios');
        await axios.post(
          hotel.integration.whatsappApiUrl,
          {
            number: hotel.telefone,
            textMessage: {
              text: `⚠️ *Conta Suspensa*\n\nOlá ${hotel.nome}, infelizmente sua conta foi suspensa.\n\nMotivo: ${payload.reason}\n\nPara regularizar, entre em contato pelo suporte ou realize o pagamento pendente.`,
            },
          },
          {
            headers: {
              apikey: hotel.integration.whatsappToken,
              'Content-Type': 'application/json',
            },
            timeout: 5000,
          },
        );
      }
    } catch (err) {
      this.logger.warn(`Falha ao notificar suspensão:`, err);
    }
  }
}
