import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WhatsappService } from '../whatsapp.service';
import { PrismaService } from '../../core/prisma.service';

@Injectable()
export class WhatsappListener {
  private readonly logger = new Logger(WhatsappListener.name);

  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('reservation.created')
  async handleReservationCreatedEvent(reservation: any) {
    this.logger.log(
      `Processando evento reservation.created para reserva ID: ${reservation.id}`,
    );

    try {
      // Garantir que temos os dados necessarios
      if (!reservation.guest || !reservation.hotel) {
        const fullRes = await this.prisma.client.reservation.findUnique({
          where: { id: reservation.id },
          include: { guest: true, hotel: true },
        });
        if (fullRes) {
          reservation = fullRes;
        } else {
          return;
        }
      }

      // O hotelSlug no banco nao existe diretamente na entidade hotel, usaremos o ID limpo ou uma formatacao simples.
      // O slug geralmente e feito no frontend, mas vamos usar uma versao simples para simular.
      const hotelSlug = reservation.hotel.nome
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      await this.whatsappService.sendWelcomeAndPanelLink(
        reservation.hotelId,
        reservation.guest.nome.split(' ')[0], // Primeiro nome
        reservation.guest.telefone,
        reservation.guestToken,
        hotelSlug,
      );
    } catch (error: any) {
      this.logger.error(
        `Erro ao disparar mensagem de WhatsApp para reserva ${reservation.id}: ${error.message}`,
      );
    }
  }
}
