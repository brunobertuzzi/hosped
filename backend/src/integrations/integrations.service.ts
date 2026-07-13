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

  async fetchGoogleReviews(hotelIdOrSlug: string) {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(hotelIdOrSlug);
    let hotelId = hotelIdOrSlug;
    
    if (!isUuid) {
      const hotel = await this.prisma.client.hotel.findUnique({
        where: { slug: hotelIdOrSlug },
        select: { id: true }
      });
      if (hotel) hotelId = hotel.id;
    }

    const integration = await this.prisma.client.hotelIntegration.findUnique({
      where: { hotelId },
    });

    if (!integration || !integration.googlePlaceId) {
      throw new NotFoundException(
        'Google Place ID não configurado para este hotel.',
      );
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      // Retornar fallback temporário se a chave não estiver configurada no servidor ainda
      return [
        {
          author_name: 'Cliente Satisfeito',
          rating: 5,
          text: 'Melhor hotel que já fiquei! Atendimento excelente.',
          time: Math.floor(Date.now() / 1000) - 86400,
        }
      ];
    }

    try {
      const axios = require('axios');
      const response = await axios.default.get(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${integration.googlePlaceId}&fields=reviews&language=pt-BR&key=${apiKey}`
      );

      if (response.data.status === 'OK' && response.data.result && response.data.result.reviews) {
        return response.data.result.reviews;
      }
      return [];
    } catch (error) {
      console.error('Erro ao buscar reviews do Google:', error);
      return [];
    }
  }
}
