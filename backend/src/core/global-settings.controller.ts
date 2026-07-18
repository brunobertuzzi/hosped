import { Controller, Get, Put, Body, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PrismaService } from './prisma.service';

const DEFAULT_SETTINGS = {
  platformName: 'Hosped',
  supportEmail: process.env.SUPPORT_EMAIL || 'suporte@hosped.com',
  helpCenterUrl: '/guia',
  paymentGateways: [],
};

@Controller('core/global-settings')
export class GlobalSettingsController {

  constructor(private readonly prisma: PrismaService) {}

  @Get('public')
  async getPublicSettings() {
    const settings = await this.prisma.client.globalSettings.findUnique({
      where: { id: '1' }
    });
    
    return {
      platformName: settings?.platformName || DEFAULT_SETTINGS.platformName,
      supportEmail: settings?.supportEmail || DEFAULT_SETTINGS.supportEmail,
      helpCenterUrl: settings?.helpCenterUrl || DEFAULT_SETTINGS.helpCenterUrl,
    };
  }

  @Get()
  @UseGuards(AuthGuard)
  async getSettings(@Request() req: any) {
    if (req.user.role !== 'PLATFORM_OWNER') {
      throw new UnauthorizedException('Acesso negado.');
    }
    const settings = await this.prisma.client.globalSettings.findUnique({
      where: { id: '1' }
    });
    return settings || { id: '1', ...DEFAULT_SETTINGS };
  }

  @Put()
  @UseGuards(AuthGuard)
  async updateSettings(@Body() body: any, @Request() req: any) {
    if (req.user.role !== 'PLATFORM_OWNER') {
      throw new UnauthorizedException('Acesso negado.');
    }
    const data: any = {};
    if (body.paymentGateways !== undefined) data.paymentGateways = body.paymentGateways;
    if (body.platformName !== undefined) data.platformName = body.platformName;
    if (body.supportEmail !== undefined) data.supportEmail = body.supportEmail;
    if (body.helpCenterUrl !== undefined) data.helpCenterUrl = body.helpCenterUrl;

    const settings = await this.prisma.client.globalSettings.upsert({
      where: { id: '1' },
      create: { id: '1', platformName: 'Hosped', supportEmail: process.env.SUPPORT_EMAIL || 'suporte@hosped.com', helpCenterUrl: '/guia', paymentGateways: [], ...data },
      update: data,
    });
    return { success: true, settings };
  }
}
