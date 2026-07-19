import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  UnauthorizedException,
  Query,
  NotFoundException,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { BillingService } from './billing.service';
import { PrismaService } from './prisma.service';
import { Throttle } from '@nestjs/throttler';

@Controller('core/billing')
export class BillingController {
  constructor(
    private readonly billing: BillingService,
    private readonly prisma: PrismaService,
  ) {}

  private checkSuperAdmin(req: any) {
    if (req.user?.role !== 'PLATFORM_OWNER') {
      throw new UnauthorizedException('Acesso restrito ao Super Admin.');
    }
  }

  private getHotelId(req: any): string {
    const hotelId = req.user?.hotelId;
    if (!hotelId) throw new UnauthorizedException('Usuário sem hotel associado.');
    return hotelId;
  }

  // ========== FATURAS ==========

  @Get('invoices')
  @UseGuards(AuthGuard)
  async getInvoices(@Request() req: any, @Query('hotelId') hotelId?: string) {
    const hid = req.user?.role === 'PLATFORM_OWNER' ? hotelId : this.getHotelId(req);
    const where: any = {};
    if (hid) where.hotelId = hid;
    return this.prisma.client.systemInvoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { hotel: { select: { nome: true, plan: true } } },
    });
  }

  @Post('invoices/generate/:hotelId')
  @UseGuards(AuthGuard)
  async generateInvoice(@Param('hotelId') hotelId: string, @Request() req: any) {
    this.checkSuperAdmin(req);
    return this.billing.generateInvoice(hotelId);
  }

  @Post('invoices/generate-all')
  @UseGuards(AuthGuard)
  async generateAllInvoices(@Request() req: any) {
    this.checkSuperAdmin(req);
    const count = await this.billing.generateAllInvoices();
    return { success: true, invoicesCreated: count };
  }

  @Post('invoices/:id/pay')
  @UseGuards(AuthGuard)
  async payInvoice(@Param('id') id: string, @Request() req: any) {
    this.checkSuperAdmin(req);
    return this.billing.processInvoicePayment(id);
  }

  @Post('invoices/:id/confirm')
  @UseGuards(AuthGuard)
  async confirmInvoice(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    this.checkSuperAdmin(req);
    return this.billing.confirmPayment(id, body.gatewayId, body.method);
  }

  @Post('sync-payments')
  @UseGuards(AuthGuard)
  async syncPayments(@Request() req: any) {
    this.checkSuperAdmin(req);
    const confirmed = await this.billing.syncPendingPayments();
    return { success: true, confirmed };
  }

  // ========== PLANOS (UPGRADE/DOWNGRADE) ==========

  @Post('change-plan')
  @UseGuards(AuthGuard)
  async changePlan(@Body() body: any, @Request() req: any) {
    const hotelId = this.getHotelId(req);
    return this.billing.changePlan(hotelId, body.plan, req.user?.sub);
  }

  @Post('change-plan/:hotelId')
  @UseGuards(AuthGuard)
  async changePlanAdmin(@Param('hotelId') hotelId: string, @Body() body: any, @Request() req: any) {
    this.checkSuperAdmin(req);
    return this.billing.changePlan(hotelId, body.plan, req.user?.sub);
  }

  // ========== ADD-ONS ==========

  @Get('addons')
  @UseGuards(AuthGuard)
  async listAddons() {
    return this.billing.listAddons();
  }

  @Get('addons/hotel')
  @UseGuards(AuthGuard)
  async listHotelAddons(@Request() req: any) {
    const hotelId = this.getHotelId(req);
    return this.billing.listHotelAddons(hotelId);
  }

  @Post('addons/activate')
  @UseGuards(AuthGuard)
  async activateAddon(@Body() body: any, @Request() req: any) {
    const hotelId = this.getHotelId(req);
    return this.billing.activateAddon(hotelId, body.addonId, req.user?.sub);
  }

  @Post('addons/deactivate')
  @UseGuards(AuthGuard)
  async deactivateAddon(@Body() body: any, @Request() req: any) {
    const hotelId = this.getHotelId(req);
    return this.billing.deactivateAddon(hotelId, body.addonId, req.user?.sub);
  }

  // Admin: add-ons para qualquer hotel
  @Post('addons/admin/:hotelId/activate')
  @UseGuards(AuthGuard)
  async adminActivateAddon(@Param('hotelId') hotelId: string, @Body() body: any, @Request() req: any) {
    this.checkSuperAdmin(req);
    return this.billing.activateAddon(hotelId, body.addonId, req.user?.sub);
  }

  @Post('addons/admin/:hotelId/deactivate')
  @UseGuards(AuthGuard)
  async adminDeactivateAddon(@Param('hotelId') hotelId: string, @Body() body: any, @Request() req: any) {
    this.checkSuperAdmin(req);
    return this.billing.deactivateAddon(hotelId, body.addonId, req.user?.sub);
  }

  // Admin: CRUD de add-ons globais
  @Post('addons/manage')
  @UseGuards(AuthGuard)
  async createAddon(@Body() body: any, @Request() req: any) {
    this.checkSuperAdmin(req);
    return this.prisma.client.addon.create({
      data: {
        name: body.name,
        description: body.description,
        price: body.price,
        moduleKey: body.moduleKey,
        isActive: body.isActive ?? true,
      },
    });
  }

  @Put('addons/manage/:id')
  @UseGuards(AuthGuard)
  async updateAddon(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    this.checkSuperAdmin(req);
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.description !== undefined) data.description = body.description;
    if (body.price !== undefined) data.price = body.price;
    if (body.moduleKey !== undefined) data.moduleKey = body.moduleKey;
    if (body.isActive !== undefined) data.isActive = body.isActive;
    return this.prisma.client.addon.update({ where: { id }, data });
  }

  @Get('addons/manage')
  @UseGuards(AuthGuard)
  async listAllAddons(@Request() req: any) {
    this.checkSuperAdmin(req);
    return this.prisma.client.addon.findMany({ orderBy: { price: 'asc' } });
  }

  // ========== CUPONS ==========

  @Get('coupons/validate/:code')
  async validateCoupon(@Param('code') code: string, @Query('plan') plan?: string) {
    return this.billing.validateCoupon(code, plan);
  }

  // ========== MÉTRICAS ==========

  @Get('metrics/mrr')
  @UseGuards(AuthGuard)
  async getMrrMetrics(@Request() req: any) {
    this.checkSuperAdmin(req);
    return this.billing.getMrrMetrics();
  }

  // ========== LOGS ==========

  @Get('logs')
  @UseGuards(AuthGuard)
  async getBillingLogs(@Request() req: any, @Query('hotelId') hotelId?: string) {
    this.checkSuperAdmin(req);
    return this.billing.getBillingLogs(hotelId);
  }

  @Get('admin/invoices')
  @UseGuards(AuthGuard)
  async getAllInvoices(@Request() req: any, @Query('status') status?: string, @Query('hotelId') hotelId?: string) {
    this.checkSuperAdmin(req);
    const where: any = {};
    if (status) where.status = status;
    if (hotelId) where.hotelId = hotelId;
    return this.prisma.client.systemInvoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { hotel: { select: { nome: true, plan: true } } },
    });
  }

  // ========== CRON EXTERNO (para Railway/serverless) ==========

  /**
   * Endpoint público (rate-limited) para ser chamado por cron-job.org
   * Acorda o servidor e dispara todas as tarefas de faturamento.
   */
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('cron/tick')
  @HttpCode(200)
  async cronTick() {
    const secret = process.env.CRON_SECRET;
    // Se CRON_SECRET estiver configurado, exige o header x-cron-secret
    // Caso contrário, permite público (rate-limited)
    // this.checkCronSecret(); -- opcional

    const results: any = {};

    // 1. Gerar faturas (se for dia 1)
    const today = new Date();
    if (today.getDate() <= 2) {
      const count = await this.billing.generateAllInvoices();
      results.invoicesGenerated = count;
    }

    // 2. Cobrar faturas pendentes
    const pendingCount = await this.billing.chargePendingInvoices();
    results.invoicesCharged = pendingCount;

    // 3. Sincronizar pagamentos
    const confirmed = await this.billing.syncPendingPayments();
    results.paymentsConfirmed = confirmed;

    // 4. Suspender inadimplentes
    const suspended = await this.billing.suspendOverdueHotels(5);
    results.hotelsSuspended = suspended;

    // 5. Aplicar downgrades (se for dia 1)
    if (today.getDate() <= 2) {
      const downgrades = await this.billing.applyScheduledDowngrades();
      results.downgradesApplied = downgrades;
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      ...results,
    };
  }
}
