import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { AuthGuard } from '../auth/auth.guard';
import { ModulesGuard } from '../auth/modules.guard';
import { RequireModules } from '../auth/modules.decorator';

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @UseGuards(AuthGuard)
  @Get()
  getIntegration(@Request() req: any) {
    const hotelId = req.user?.hotelId; // Injetado pelo tenant middleware
    return this.integrationsService.getHotelIntegration(hotelId);
  }

  @UseGuards(AuthGuard, ModulesGuard)
  @RequireModules('WEBHOOKS')
  @Post('google')
  updateGooglePlaceId(@Body('placeId') placeId: string, @Body('apiKey') apiKey: string, @Request() req: any) {
    const hotelId = req.user?.hotelId;
    return this.integrationsService.updateGoogleConfig(hotelId, placeId, apiKey);
  }

  @UseGuards(AuthGuard, ModulesGuard)
  @RequireModules('WEBHOOKS')
  @Post('whatsapp')
  updateWhatsapp(@Body() body: any, @Request() req: any) {
    const hotelId = req.user?.hotelId;
    return this.integrationsService.updateWhatsappConfig(
      hotelId,
      body.whatsappApiUrl,
      body.whatsappToken,
      body.whatsappNumber,
    );
  }

  @UseGuards(AuthGuard, ModulesGuard)
  @RequireModules('WEBHOOKS')
  @Post('payment-gateway')
  updatePaymentGateway(@Body() body: any, @Request() req: any) {
    const hotelId = req.user?.hotelId;
    return this.integrationsService.updatePaymentGatewayConfig(
      hotelId,
      body.provider,
      body.token,
      body.publicKey,
    );
  }

  // Rota pública para a Landing Page / Widget
  @Get('google-reviews/:hotelId')
  getGoogleReviews(@Param('hotelId') hotelId: string) {
    return this.integrationsService.fetchGoogleReviews(hotelId);
  }
}
