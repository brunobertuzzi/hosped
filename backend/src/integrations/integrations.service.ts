import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../core/prisma.service';

@Injectable()
export class IntegrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getHotelIntegration(hotelId: string) {
    let integration = await this.prisma.client.hotelIntegration.findUnique({
      where: { hotelId },
    });

    if (!integration) {
      // Cria a integração vazia se não existir
      integration = await this.prisma.client.hotelIntegration.create({
        data: { hotelId },
      });
    }

    return integration;
  }

  async updateGoogleConfig(hotelId: string, placeId: string) {
    return this.prisma.client.hotelIntegration.upsert({
      where: { hotelId },
      create: { hotelId, googlePlaceId: placeId },
      update: { googlePlaceId: placeId },
    });
  }

  async updateWhatsappConfig(
    hotelId: string,
    whatsappApiUrl: string,
    whatsappToken: string,
    whatsappNumber: string,
  ) {
    return this.prisma.client.hotelIntegration.upsert({
      where: { hotelId },
      create: { hotelId, whatsappApiUrl, whatsappToken, whatsappNumber },
      update: { whatsappApiUrl, whatsappToken, whatsappNumber },
    });
  }

  async updatePaymentGatewayConfig(
    hotelId: string,
    provider: string,
    token: string,
    pubKey: string,
  ) {
    return this.prisma.client.hotelIntegration.upsert({
      where: { hotelId },
      create: {
        hotelId,
        paymentGatewayProvider: provider,
        paymentGatewayToken: token,
        paymentGatewayPubKey: pubKey,
      },
      update: {
        paymentGatewayProvider: provider,
        paymentGatewayToken: token,
        paymentGatewayPubKey: pubKey,
      },
    });
  }

  async fetchGoogleReviews(hotelId: string) {
    const integration = await this.prisma.client.hotelIntegration.findUnique({
      where: { hotelId },
    });

    if (!integration || !integration.googlePlaceId) {
      throw new NotFoundException(
        'Google Place ID não configurado para este hotel.',
      );
    }

    // AQUI ENTRARIA A CHAMADA REAL PARA A API DO GOOGLE PLACES
    // Ex: GET https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${API_KEY}

    // Retornando Mock para exemplificação
    return [
      {
        author_name: 'Cliente Satisfeito',
        rating: 5,
        text: 'Melhor hotel que já fiquei! Atendimento excelente.',
        time: Math.floor(Date.now() / 1000) - 86400,
      },
      {
        author_name: 'Maria Silva',
        rating: 5,
        text: 'Quartos muito limpos e café da manhã maravilhoso.',
        time: Math.floor(Date.now() / 1000) - 172800,
      },
    ];
  }
}
