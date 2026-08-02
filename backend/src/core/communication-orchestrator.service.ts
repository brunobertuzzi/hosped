import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailService } from './email.service';
import { WhatsappService } from '../integrations/whatsapp.service';
import { PrismaService } from './prisma.service';

@Injectable()
export class CommunicationOrchestratorService {
  private readonly logger = new Logger(CommunicationOrchestratorService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly whatsappService: WhatsappService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Lida com o evento reservation.created:
   * - E-mail de confirmação da reserva
   * - Mensagem WhatsApp com boas-vindas + link do Painel do Hóspede
   */
  @OnEvent('reservation.created')
  async handleReservationCreated(reservation: any) {
    this.logger.log(
      `[Orchestrator] Processando reservation.created: ${reservation.id}`,
    );

    try {
      const fullRes = await this.loadFullReservation(reservation);
      if (!fullRes) return;

      const { guest, hotel, category } = fullRes as any;
      const hotelSlug = this.slugify(hotel?.nome || 'hotel');

      // 1. E-mail de confirmação
      await this.emailService.sendConfirmationEmail(
        guest.email,
        guest.nome,
        this.formatDate(fullRes.dataCheckIn),
        this.formatDate(fullRes.dataCheckOut),
        hotel?.nome || 'Hotel',
        category?.nome || 'Quarto',
        fullRes.guestToken,
        hotelSlug,
      );

      // 2. WhatsApp — boas-vindas com link do Painel do Hóspede
      if (guest.telefone) {
        await this.whatsappService.sendWelcomeAndPanelLink(
          fullRes.hotelId,
          guest.nome,
          guest.telefone,
          fullRes.guestToken,
          hotelSlug,
        );
      }

      this.logger.log(
        `[Orchestrator] reservation.created processado com sucesso: ${reservation.id}`,
      );
    } catch (error: any) {
      this.logger.error(
        `[Orchestrator] Erro em reservation.created (${reservation.id}): ${error.message}`,
      );
    }
  }

  /**
   * Lida com o evento reservation.checked-in:
   * - E-mail de boas-vindas na chegada
   * - Mensagem WhatsApp de boas-vindas
   */
  @OnEvent('reservation.checked-in')
  async handleReservationCheckedIn(reservation: any) {
    this.logger.log(
      `[Orchestrator] Processando reservation.checked-in: ${reservation.id}`,
    );

    try {
      const fullRes = await this.loadFullReservation(reservation, true);
      if (!fullRes) return;

      const { guest, hotel, room } = fullRes as any;
      const hotelSlug = this.slugify(hotel?.nome || 'hotel');

      // 1. E-mail de boas-vindas na chegada
      await this.emailService.sendWelcomeOnArrivalEmail(
        guest.email,
        guest.nome,
        room?.numero || '—',
        hotel?.nome || 'Hotel',
        this.formatDate(fullRes.dataCheckOut),
      );

      // 2. WhatsApp — aviso de check-in realizado
      if (guest.telefone) {
        const welcomeMsg = `Olá, ${guest.nome}! ✅ Seu check-in no *${hotel?.nome || 'Hotel'}* foi realizado com sucesso.\n\nQuarto: ${room?.numero || '—'}\nCheck-out: ${this.formatDate(fullRes.dataCheckOut)}\n\nDesejamos uma ótima estadia! 🎉`;
        await this.whatsappService.sendMessage(
          fullRes.hotelId,
          guest.telefone,
          welcomeMsg,
        );
      }

      this.logger.log(
        `[Orchestrator] reservation.checked-in processado com sucesso: ${reservation.id}`,
      );
    } catch (error: any) {
      this.logger.error(
        `[Orchestrator] Erro em reservation.checked-in (${reservation.id}): ${error.message}`,
      );
    }
  }

  /**
   * Lida com o evento reservation.checked-out:
   * - E-mail de lembrete de check-out + extrato (se já estiver saindo, funciona como recibo)
   * - E-mail pós-estadia (agradecimento + feedback)
   * - WhatsApp de despedida
   */
  @OnEvent('reservation.checked-out')
  async handleReservationCheckedOut(reservation: any) {
    this.logger.log(
      `[Orchestrator] Processando reservation.checked-out: ${reservation.id}`,
    );

    try {
      const fullRes = await this.loadFullReservation(reservation, true);
      if (!fullRes) return;

      const { guest, hotel } = fullRes as any;
      const hotelSlug = this.slugify(hotel?.nome || 'hotel');

      // 1. E-mail de resumo/recibo de check-out
      await this.emailService.sendCheckOutReminderEmail(
        guest.email,
        guest.nome,
        this.formatDate(fullRes.dataCheckOut),
        hotel?.nome || 'Hotel',
        hotelSlug,
        fullRes.guestToken,
      );

      // 2. E-mail pós-estadia (agradecimento e feedback)
      await this.emailService.sendPostStayEmail(
        guest.email,
        guest.nome,
        hotel?.nome || 'Hotel',
        hotelSlug,
        fullRes.guestToken,
      );

      // 3. WhatsApp — agradecimento
      if (guest.telefone) {
        const goodbyeMsg = `Olá, ${guest.nome}! 🙏 Muito obrigado por se hospedar no *${hotel?.nome || 'Hotel'}*.\n\nEsperamos que tenha tido uma experiência incrível! Sua opinião é muito importante — deixe seu feedback:\n${process.env.FRONTEND_URL || 'http://localhost:3000'}/${hotelSlug}/hospede/${fullRes.guestToken}/feedback\n\nVolte sempre! 🎉`;
        await this.whatsappService.sendMessage(
          fullRes.hotelId,
          guest.telefone,
          goodbyeMsg,
        );
      }

      this.logger.log(
        `[Orchestrator] reservation.checked-out processado com sucesso: ${reservation.id}`,
      );
    } catch (error: any) {
      this.logger.error(
        `[Orchestrator] Erro em reservation.checked-out (${reservation.id}): ${error.message}`,
      );
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────

  private async loadFullReservation(
    reservation: any,
    includeRoom = false,
  ): Promise<any> {
    if (reservation.guest && reservation.hotel) {
      return reservation;
    }

    const fullRes = await this.prisma.client.reservation.findUnique({
      where: { id: reservation.id },
      include: {
        guest: true,
        hotel: true,
        category: true,
        ...(includeRoom ? { room: true } : {}),
      },
    });

    if (!fullRes) {
      this.logger.warn(
        `Reserva não encontrada no banco: ${reservation.id}`,
      );
      return null;
    }

    return fullRes;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  private formatDate(date: Date | string): string {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }
}