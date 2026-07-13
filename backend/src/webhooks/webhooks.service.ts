import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma.service';
import { WebhookStatus } from '@prisma/client';

@Injectable()
export class WebhooksService {
  constructor(private readonly prisma: PrismaService) {}

  async processMercadoPago(hotelId: string, payload: any) {
    let eventType = payload.type || payload.action || 'unknown';
    let status: WebhookStatus = WebhookStatus.RECEBIDO;

    // Processa notificação de pagamento PIX
    if (payload.type === 'payment' || payload.action === 'payment.updated') {
      status = WebhookStatus.PROCESSADO;
      // Aqui poderia atualizar o status do pagamento no banco
      // Ex: buscar transacaoId no payload e atualizar payment.status
    }

    const webhook = await this.prisma.client.webhookEvent.create({
      data: {
        hotelId,
        provider: 'MERCADO_PAGO',
        eventType,
        payload,
        status,
      },
    });

    return webhook;
  }

  async findAllLogs() {
    return this.prisma.client.webhookEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        hotel: { select: { nome: true } },
      },
    });
  }

  async findByHotel(hotelId: string) {
    return this.prisma.client.webhookEvent.findMany({
      where: { hotelId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
