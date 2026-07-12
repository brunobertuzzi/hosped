import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../core/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import axios from 'axios';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('whatsapp-queue') private readonly whatsappQueue: Queue,
  ) {}

  /**
   * Enfileira uma mensagem para envio via WhatsApp para o hóspede.
   */
  async sendMessage(hotelId: string, toPhone: string, message: string) {
    await this.whatsappQueue.add('send-message', {
      hotelId,
      toPhone,
      message,
    });
    return true;
  }

  /**
   * Envia efetivamente uma mensagem via WhatsApp para o hóspede. (Processado pelo worker)
   */
  async sendMessageSync(hotelId: string, toPhone: string, message: string) {
    // 1. Buscar a configuração de integração do hotel
    const integration = await this.prisma.client.hotelIntegration.findUnique({
      where: { hotelId },
    });

    const isDev = process.env.NODE_ENV !== 'production';

    if (!integration || !integration.whatsappToken) {
      this.logger.warn(`WhatsApp não configurado para o hotel ${hotelId}.`);
      if (!isDev) {
        return false;
      }
      this.logger.log(`Rodando em DEV: Forçando log da mensagem simulada.`);
    }

    // Executa a requisição apenas se tiver as chaves
    if (!integration || !integration.whatsappApiUrl || !integration.whatsappToken) {
      return false; // Silenciosamente falha (ou lança erro dependendo da regra de negócio)
    }

    try {
        await axios.post(
          integration.whatsappApiUrl,
          {
            number: toPhone,
            options: {
              delay: 1200,
              presence: 'composing',
            },
            textMessage: {
              text: message,
            },
          },
          {
            headers: {
              apikey: integration.whatsappToken,
              'Content-Type': 'application/json',
            },
          },
        );
        this.logger.log(
          `[WHATSAPP] Mensagem enviada com sucesso para ${toPhone} via API.`,
        );
    } catch (error: any) {
      this.logger.error(
        `[WHATSAPP] Falha ao enviar para API ${integration.whatsappApiUrl}: ${error.message}`,
      );
    }

    return true;
  }

  /**
   * Dispara a mensagem de boas-vindas com o link do Painel do Hóspede
   */
  async sendWelcomeAndPanelLink(
    hotelId: string,
    guestName: string,
    guestPhone: string,
    guestToken: string,
    hotelSlug: string,
  ) {
    const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/${hotelSlug}/hospede/${guestToken}`;

    const message = `Olá, ${guestName}! 🎉
Sua reserva foi confirmada com sucesso no *${hotelSlug.toUpperCase()}*! 

Acesse o seu *Painel do Hóspede* para ver o extrato, fazer o pré check-in e agilizar sua chegada:
👉 ${link}

Agradecemos a preferência!`;

    return this.sendMessage(hotelId, guestPhone, message);
  }
}
