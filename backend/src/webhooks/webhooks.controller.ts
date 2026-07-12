import { Controller, Post, Get, Body, Req, Headers, UseGuards, Request, UnauthorizedException, HttpCode, Param } from '@nestjs/common';
import { PrismaService } from '../core/prisma.service';
import { AuthGuard } from '../auth/auth.guard';
import { WebhookStatus } from '@prisma/client';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('mercadopago/:hotelId')
  @HttpCode(200)
  async handleMercadoPago(
    @Param('hotelId') hotelId: string,
    @Body() payload: any,
  ) {
    if (!payload) return { received: true };

    let eventType = payload.type || payload.action || 'unknown';
    
    await this.prisma.client.webhookEvent.create({
      data: {
        hotelId,
        event: eventType,
        payload: payload,
        status: WebhookStatus.RECEBIDO
      }
    });

    return { received: true };
  }

  @Get('logs')
  @UseGuards(AuthGuard)
  async getWebhookLogs(@Request() req: any) {
    if (req.user.role !== 'PLATFORM_OWNER') {
      throw new UnauthorizedException('Somente Super Admin pode ver webhooks.');
    }

    const logs = await this.prisma.client.webhookEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        hotel: { select: { nome: true } }
      }
    });

    return logs.map(l => ({
      id: l.id,
      tenantId: l.hotelId,
      tenantName: l.hotel.nome,
      event: l.event,
      provider: 'MERCADO_PAGO',
      status: l.status === 'RECEBIDO' ? 200 : 500,
      timestamp: l.createdAt,
      payload: JSON.stringify(l.payload)
    }));
  }
}
