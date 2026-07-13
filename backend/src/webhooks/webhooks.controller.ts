import { Controller, Post, Get, Body, Req, Headers, UseGuards, Request, UnauthorizedException, HttpCode, Param } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('mercadopago/:hotelId')
  @HttpCode(200)
  async handleMercadoPago(
    @Param('hotelId') hotelId: string,
    @Body() payload: any,
  ) {
    if (!payload) return { received: true };
    await this.webhooksService.processMercadoPago(hotelId, payload);
    return { received: true };
  }

  @Get('logs')
  @UseGuards(AuthGuard)
  async getWebhookLogs(@Request() req: any) {
    if (req.user.role !== 'PLATFORM_OWNER') {
      throw new UnauthorizedException('Somente Super Admin pode ver webhooks.');
    }

    const logs = await this.webhooksService.findAllLogs();

    return logs.map((l: any) => ({
      id: l.id,
      tenantId: l.hotelId,
      tenantName: l.hotel?.nome || 'N/A',
      event: l.eventType,
      provider: l.provider || 'MERCADO_PAGO',
      status: l.status === 'RECEBIDO' ? 200 : 500,
      timestamp: l.createdAt,
      payload: JSON.stringify(l.payload),
    }));
  }
}
