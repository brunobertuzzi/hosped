import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { MercadoPagoConfig, Payment as MercadoPagoPayment } from 'mercadopago';
import { PrismaService } from '../core/prisma.service';
import { PaymentMethod } from '@prisma/client';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { WhatsappService } from '../integrations/whatsapp.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsappService,
  ) {
    // A chave ambiente agora é usada EXCLUSIVAMENTE para o dono do Sistema cobrar a mensalidade dos hotéis
    const sistemaToken = process.env.SISTEMA_PAYMENT_TOKEN || '';
    if (!sistemaToken) {
      this.logger.warn(
        'SISTEMA_PAYMENT_TOKEN NOT FOUND. Sistema Monthly Billing may fail or run in mock mode.',
      );
    }
  }

  /**
   * Helper para instanciar o MercadoPago com o token correto (do hotel ou do Sistema)
   */
  private getMpClient(token: string): MercadoPagoConfig {
    return new MercadoPagoConfig({
      accessToken: token,
      options: { timeout: 5000 },
    });
  }

  async createPixPayment(dto: CreatePaymentDto, userId?: string) {
    if (!dto.email) {
      throw new BadRequestException('Email do pagador é obrigatório para gerar PIX.');
    }

    return this.prisma.client.$transaction(async (tx: any) => {
      // Validar reserva e carregar a integração do hotel
      const reservation = await tx.reservation.findUnique({
        where: { id: dto.reservationId },
        include: { hotel: { include: { integration: true } } },
      });
      if (!reservation) {
        throw new NotFoundException('Reserva não encontrada.');
      }

      const token = reservation.hotel.integration?.paymentGatewayToken;
      const provider = reservation.hotel.integration?.paymentGatewayProvider;

      let resultId: string | number = '';
      let pointOfInteraction;

      if (!token || provider !== 'MERCADO_PAGO') {
        throw new Error('O Hotel não possui um Gateway de Pagamento configurado (Mercado Pago). Vá em Integrações para configurar.');
      } else if (provider === 'MERCADO_PAGO') {
        const client = this.getMpClient(token);
        const payment = new MercadoPagoPayment(client);
        const request = {
          transaction_amount: Number(dto.amount),
          description: dto.description || 'Reserva Hotel',
          payment_method_id: 'pix',
          payer: { email: dto.email },
        };
        const result = await payment.create({ body: request });
        resultId = result.id || '';
        pointOfInteraction = result.point_of_interaction;
      }

      if (!resultId) {
        throw new Error('Falha ao gerar o ID do pagamento PIX');
      }

      // Salvar no banco vinculado à reserva (explicit hotelId defensive)
      await tx.payment.create({
        data: {
          hotelId: reservation.hotelId,
          reservationId: dto.reservationId,
          valor: dto.amount,
          metodo: PaymentMethod.PIX,
          status: 'PENDENTE',
          transacaoId: resultId.toString(),
        },
      });

      return {
        id: resultId,
        point_of_interaction: pointOfInteraction,
      };
    });
  }

  async getPaymentStatus(id: string) {
    // 1. Consultar no banco e pegar a integração do hotel
    const paymentRecord = await this.prisma.client.payment.findFirst({
      where: { transacaoId: id },
      include: { hotel: { include: { integration: true } } },
    });

    if (!paymentRecord) {
      throw new NotFoundException('Pagamento não encontrado no sistema.');
    }

    if (paymentRecord.status === 'APROVADO') {
      return { status: 'approved' };
    }

    const token = paymentRecord.hotel.integration?.paymentGatewayToken;
    const provider = paymentRecord.hotel.integration?.paymentGatewayProvider;
    let isApproved = false;

    if (!token || provider !== 'MERCADO_PAGO') {
      throw new Error('Gateway de pagamento não configurado para o hotel.');
    } else if (provider === 'MERCADO_PAGO') {
      try {
        const client = this.getMpClient(token);
        const payment = new MercadoPagoPayment(client);
        const result = await payment.get({ id });
        isApproved = result.status === 'approved';
      } catch (error) {
        this.logger.error(`Error checking payment ${id}:`, error);
        throw new Error('Falha ao consultar status no gateway do hotel');
      }
    }

    if (isApproved) {
      await this.prisma.client.payment.update({
        where: { id: paymentRecord.id },
        data: { status: 'APROVADO' },
      });

      // Atualiza a Reserva para Confirmada
      const reservation = await this.prisma.client.reservation.update({
        where: { id: paymentRecord.reservationId },
        data: { status: 'CONFIRMADA' },
        include: { guest: true, hotel: true },
      });

      // Envia notificação no WhatsApp
      await this.whatsappService.sendWelcomeAndPanelLink(
        reservation.hotelId,
        reservation.guest.nome,
        reservation.guest.telefone,
        reservation.guestToken,
        reservation.hotel.id, // Para o demo, usamos o hotelId como slug da rota
      );

      return { status: 'approved' };
    }

    return { status: 'pending' };
  }
}
