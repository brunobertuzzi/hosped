import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MercadoPagoConfig, Payment as MercadoPagoPayment } from 'mercadopago';
import { InvoiceStatus, Prisma } from '@prisma/client';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Retorna o client do gateway central do SISTEMA (para cobrar hotéis)
   */
  private getSistemaMpClient() {
    const token = process.env.SISTEMA_PAYMENT_TOKEN;
    if (!token) return null;
    return new MercadoPagoConfig({
      accessToken: token,
      options: { timeout: 10000 },
    });
  }

  // ============================================================
  //  FATURAMENTO RECORRENTE
  // ============================================================

  /**
   * Gera a fatura do mês para um hotel
   */
  async generateInvoice(hotelId: string): Promise<any> {
    const hotel = await this.prisma.client.hotel.findUnique({
      where: { id: hotelId },
      include: { hotelAddons: { where: { isActive: true }, include: { addon: true } } },
    });

    if (!hotel) throw new NotFoundException('Hotel não encontrado');
    if (hotel.status === 'SUSPENDED' || hotel.status === 'CHURNED') {
      this.logger.warn(`Hotel ${hotel.nome} (${hotelId}) está ${hotel.status}. Pulando geração de fatura.`);
      return null;
    }

    // Calcular valor total: MRR base + add-ons
    const mrrBase = new Prisma.Decimal(hotel.mrr || 0);
    let addonsTotal = new Prisma.Decimal(0);
    if (hotel.hotelAddons?.length) {
      for (const ha of hotel.hotelAddons) {
        addonsTotal = addonsTotal.add(ha.price);
      }
    }
    const totalAmount = mrrBase.add(addonsTotal);

    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 5); // Vence em 5 dias

    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Gerar invoice
    const invoice = await this.prisma.client.systemInvoice.create({
      data: {
        hotelId,
        amount: totalAmount,
        status: 'PENDENTE' as InvoiceStatus,
        dueDate,
        periodStart,
        periodEnd,
        attemptCount: 0,
      },
    });

    // Atualizar nextBillingDate e lastInvoiceId no hotel
    const nextBilling = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    await this.prisma.client.hotel.update({
      where: { id: hotelId },
      data: {
        nextBillingDate: nextBilling,
        lastInvoiceId: invoice.id,
      },
    });

    // Log
    await this.createBillingLog(hotelId, 'INVOICE_CREATED', `Fatura ${invoice.id} gerada no valor de R$ ${totalAmount}`, {
      invoiceId: invoice.id,
      amount: totalAmount.toString(),
      dueDate: dueDate.toISOString(),
    });

    this.eventEmitter.emit('billing.invoice.created', {
      hotelId,
      invoiceId: invoice.id,
      amount: totalAmount,
      dueDate,
    });

    this.logger.log(`Fatura ${invoice.id} gerada para ${hotel.nome} — R$ ${totalAmount}`);

    return invoice;
  }

  /**
   * Gera faturas para TODOS os hotéis ativos que estão no período de cobrança
   */
  async generateAllInvoices(): Promise<number> {
    const now = new Date();
    const hotels = await this.prisma.client.hotel.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { nextBillingDate: { lte: now } },
          { nextBillingDate: null },
        ],
      },
    });

    let count = 0;
    for (const hotel of hotels) {
      try {
        // Verificar se já não tem fatura pendente para este período
        const pendingInvoice = await this.prisma.client.systemInvoice.findFirst({
          where: {
            hotelId: hotel.id,
            status: 'PENDENTE',
            periodStart: {
              gte: new Date(now.getFullYear(), now.getMonth(), 1),
            },
          },
        });
        if (pendingInvoice) continue;

        await this.generateInvoice(hotel.id);
        count++;
      } catch (err) {
        this.logger.error(`Erro ao gerar fatura para ${hotel.id}:`, err);
      }
    }

    this.logger.log(`Geração em massa concluída: ${count} faturas criadas.`);
    return count;
  }

  /**
   * Processa o pagamento de uma fatura via gateway central
   */
  async processInvoicePayment(invoiceId: string): Promise<any> {
    const invoice = await this.prisma.client.systemInvoice.findUnique({
      where: { id: invoiceId },
      include: { hotel: true },
    });

    if (!invoice) throw new NotFoundException('Fatura não encontrada');
    if (invoice.status === 'PAGO') return { status: 'already_paid' };

    const client = this.getSistemaMpClient();
    if (!client) {
      this.logger.warn('SISTEMA_PAYMENT_TOKEN não configurado. Pulando cobrança real.');
      return { status: 'no_gateway' };
    }

    // Marcar tentativa
    await this.prisma.client.systemInvoice.update({
      where: { id: invoiceId },
      data: {
        attemptCount: { increment: 1 },
        lastAttemptAt: new Date(),
      },
    });

    try {
      const payment = new MercadoPagoPayment(client);
      const result = await payment.create({
        body: {
          transaction_amount: Number(invoice.amount),
          description: `Assinatura Hosped — ${invoice.hotel.nome} — ${invoice.periodStart?.toLocaleDateString('pt-BR')}`,
          payment_method_id: 'pix',
          payer: {
            email: invoice.hotel.email,
          },
        },
      });

      // Salvar dados do gateway
      await this.prisma.client.systemInvoice.update({
        where: { id: invoiceId },
        data: {
          gatewayPaymentId: result.id?.toString(),
          paymentLink: result.point_of_interaction?.transaction_data?.qr_code,
          paymentMethod: 'PIX',
        },
      });

      await this.createBillingLog(invoice.hotelId, 'PAYMENT_ATTEMPT', `Cobrança PIX gerada via gateway central`, {
        invoiceId,
        gatewayId: result.id?.toString(),
        status: result.status,
      });

      // Se já aprovou, marcar como pago
      if (result.status === 'approved') {
        return await this.confirmPayment(invoiceId, result.id?.toString(), 'PIX');
      }

      return {
        status: result.status,
        qr_code: result.point_of_interaction?.transaction_data?.qr_code,
        invoiceId,
      };
    } catch (err: any) {
      this.logger.error(`Falha ao cobrar fatura ${invoiceId}:`, err.message);

      await this.createBillingLog(invoice.hotelId, 'PAYMENT_FAILED', `Falha no gateway: ${err.message}`, {
        invoiceId,
        error: err.message,
      });

      return { status: 'failed', error: err.message };
    }
  }

  /**
   * Confirma pagamento de uma fatura e reativa hotel se suspenso
   */
  async confirmPayment(invoiceId: string, gatewayId?: string, method?: string): Promise<any> {
    const invoice = await this.prisma.client.systemInvoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) throw new NotFoundException('Fatura não encontrada');

    const now = new Date();
    const result = await this.prisma.client.systemInvoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAGO' as InvoiceStatus,
        paidAt: now,
        gatewayPaymentId: gatewayId || invoice.gatewayPaymentId,
        paymentMethod: method || invoice.paymentMethod,
      },
    });

    // Se hotel estava suspenso, reativar
    const hotel = await this.prisma.client.hotel.findUnique({
      where: { id: invoice.hotelId },
    });

    if (hotel?.status === 'SUSPENDED') {
      await this.prisma.client.hotel.update({
        where: { id: invoice.hotelId },
        data: { status: 'ACTIVE' },
      });

      await this.createBillingLog(invoice.hotelId, 'REACTIVATED', 'Hotel reativado após pagamento', {
        invoiceId,
      });
    }

    await this.createBillingLog(invoice.hotelId, 'PAYMENT_SUCCESS', `Pagamento confirmado: R$ ${invoice.amount}`, {
      invoiceId,
      amount: invoice.amount.toString(),
    });

    this.eventEmitter.emit('billing.payment.confirmed', {
      hotelId: invoice.hotelId,
      invoiceId,
      amount: invoice.amount,
    });

    this.logger.log(`Pagamento confirmado para fatura ${invoiceId}`);
    return result;
  }

  /**
   * Verifica status de pagamentos pendentes no gateway
   */
  async syncPendingPayments(): Promise<number> {
    const pendingInvoices = await this.prisma.client.systemInvoice.findMany({
      where: {
        status: 'PENDENTE',
        gatewayPaymentId: { not: null },
        attemptCount: { gt: 0 },
      },
      take: 50,
    });

    const client = this.getSistemaMpClient();
    if (!client) return 0;

    let confirmed = 0;

    for (const inv of pendingInvoices) {
      try {
        const payment = new MercadoPagoPayment(client);
        const result = await payment.get({ id: inv.gatewayPaymentId! });

        if (result.status === 'approved') {
          await this.confirmPayment(inv.id, inv.gatewayPaymentId!, 'PIX');
          confirmed++;
        }
      } catch (err) {
        this.logger.warn(`Erro ao sync fatura ${inv.id}:`, err);
      }
    }

    return confirmed;
  }

  /**
   * Suspende hotéis com faturamento atrasado > X dias
   */
  async suspendOverdueHotels(daysOverdue: number = 5): Promise<number> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - daysOverdue);

    const overdueInvoices = await this.prisma.client.systemInvoice.findMany({
      where: {
        status: 'PENDENTE',
        dueDate: { lt: threshold },
      },
      include: { hotel: true },
    });

    const hotelIds = [...new Set(overdueInvoices.map((i: any) => i.hotelId))];
    let suspended = 0;

    for (const hotelId of hotelIds) {
      const hotel = overdueInvoices.find((i: any) => i.hotelId === hotelId)?.hotel;
      if (!hotel || hotel.status !== 'ACTIVE') continue;

      await this.prisma.client.hotel.update({
        where: { id: hotelId as string },
        data: { status: 'SUSPENDED' },
      });

      await this.createBillingLog(hotelId as string, 'SUSPENDED', `Hotel suspenso por inadimplência (> ${daysOverdue} dias)`, {
        overdueInvoices: overdueInvoices.filter((i: any) => i.hotelId === hotelId).length,
      });

      this.eventEmitter.emit('billing.suspended', {
        hotelId,
        reason: `Faturamento atrasado por mais de ${daysOverdue} dias`,
      });

      this.logger.warn(`Hotel ${hotel?.nome} (${hotelId}) suspenso por inadimplência.`);
      suspended++;
    }

    return suspended;
  }

  // ============================================================
  //  UPGRADE / DOWNGRADE
  // ============================================================

  async changePlan(hotelId: string, newPlan: string, userId?: string): Promise<any> {
    const hotel = await this.prisma.client.hotel.findUnique({
      where: { id: hotelId },
    });
    if (!hotel) throw new NotFoundException('Hotel não encontrado');

    const planData = await this.prisma.client.systemPlan.findUnique({
      where: { name: newPlan },
    });
    if (!planData) throw new BadRequestException(`Plano "${newPlan}" não encontrado`);
    if (!planData.isActive) throw new BadRequestException('Plano não está ativo');

    const oldPlan = hotel.plan;
    const oldMrr = hotel.mrr;
    const newMrr = Number(planData.price);
    const isUpgrade = newMrr > oldMrr;

    // Prorata: calcular crédito/débito dos dias restantes
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const remainingDays = daysInMonth - dayOfMonth + 1;
    const dailyRateOld = oldMrr / daysInMonth;
    const dailyRateNew = newMrr / daysInMonth;
    const credit = dailyRateOld * remainingDays;
    const charge = dailyRateNew * remainingDays;

    await this.prisma.client.hotel.update({
      where: { id: hotelId },
      data: {
        plan: newPlan,
        mrr: newMrr,
        enabledModules: planData.modules,
      },
    });

    // Gerar fatura de diferença se for upgrade
    if (isUpgrade && charge > credit) {
      const diffAmount = charge - credit;
      const invoice = await this.prisma.client.systemInvoice.create({
        data: {
          hotelId,
          amount: diffAmount,
          status: 'PENDENTE' as InvoiceStatus,
          dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
          periodStart: now,
          periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
        },
      });

      await this.createBillingLog(hotelId, 'UPGRADED', `Upgrade de ${oldPlan} para ${newPlan}. Diferença: R$ ${diffAmount.toFixed(2)}`, {
        oldPlan,
        newPlan,
        diffAmount: diffAmount.toFixed(2),
        invoiceId: invoice.id,
      });

      return { success: true, plan: newPlan, mrr: newMrr, diffInvoice: invoice };
    }

    // Se for downgrade, registrar plano para downgrade automático no fim do ciclo
    if (!isUpgrade) {
      await this.prisma.client.hotel.update({
        where: { id: hotelId },
        data: { downgradeToPlan: newPlan },
      });

      await this.createBillingLog(hotelId, 'DOWNGRADED', `Downgrade agendado de ${oldPlan} para ${newPlan} (fim do ciclo)`, {
        oldPlan,
        newPlan,
        scheduledFor: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
      });

      return { success: true, plan: oldPlan, mrr: oldMrr, downgradeScheduled: true, effectiveDate: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
    }

    await this.createBillingLog(hotelId, 'UPGRADED', `Upgrade de ${oldPlan} para ${newPlan}`, {
      oldPlan,
      newPlan,
    });

    return { success: true, plan: newPlan, mrr: newMrr };
  }

  /**
   * Aplica downgrades agendados (chamado no início do mês)
   */
  async applyScheduledDowngrades(): Promise<number> {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthEnd = new Date(monthStart);
    monthEnd.setHours(23, 59, 59, 999);
    monthEnd.setDate(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate());

    const hotels = await this.prisma.client.hotel.findMany({
      where: {
        downgradeToPlan: { not: null },
        status: 'ACTIVE',
      },
    });

    let count = 0;
    for (const hotel of hotels) {
      try {
        const planData = await this.prisma.client.systemPlan.findUnique({
          where: { name: hotel.downgradeToPlan! },
        });
        if (!planData) continue;

        await this.prisma.client.hotel.update({
          where: { id: hotel.id },
          data: {
            plan: hotel.downgradeToPlan!,
            mrr: Number(planData.price),
            downgradeToPlan: null,
            enabledModules: planData.modules,
          },
        });

        await this.createBillingLog(hotel.id, 'DOWNGRADED', `Downgrade automático aplicado para ${hotel.downgradeToPlan}`, {
          oldPlan: hotel.plan,
          newPlan: hotel.downgradeToPlan,
        });

        count++;
      } catch (err) {
        this.logger.error(`Erro ao aplicar downgrade para ${hotel.id}:`, err);
      }
    }

    return count;
  }

  // ============================================================
  //  ADD-ONS
  // ============================================================

  async listAddons() {
    return this.prisma.client.addon.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  async listHotelAddons(hotelId: string) {
    return this.prisma.client.hotelAddon.findMany({
      where: { hotelId, isActive: true },
      include: { addon: true },
    });
  }

  async activateAddon(hotelId: string, addonId: string, userId?: string): Promise<any> {
    const addon = await this.prisma.client.addon.findUnique({
      where: { id: addonId },
    });
    if (!addon) throw new NotFoundException('Add-on não encontrado');
    if (!addon.isActive) throw new BadRequestException('Add-on não está ativo');

    const hotel = await this.prisma.client.hotel.findUnique({
      where: { id: hotelId },
    });
    if (!hotel) throw new NotFoundException('Hotel não encontrado');

    // Verificar se já está ativo
    const existing = await this.prisma.client.hotelAddon.findUnique({
      where: { hotelId_addonId: { hotelId, addonId } },
    });
    if (existing?.isActive) throw new BadRequestException('Add-on já está ativo neste hotel');

    // Upsert (reativar se foi removido antes)
    await this.prisma.client.hotelAddon.upsert({
      where: { hotelId_addonId: { hotelId, addonId } },
      create: {
        hotelId,
        addonId,
        price: addon.price,
        isActive: true,
      },
      update: {
        isActive: true,
        removedAt: null,
        price: addon.price,
      },
    });

    // Adicionar módulo ao enabledModules do hotel
    const modules = hotel.enabledModules || [];
    if (!modules.includes(addon.moduleKey)) {
      modules.push(addon.moduleKey);
      await this.prisma.client.hotel.update({
        where: { id: hotelId },
        data: { enabledModules: modules },
      });
    }

    await this.createBillingLog(hotelId, 'ADDON_ACTIVATED', `Add-on "${addon.name}" ativado (R$ ${addon.price})`, {
      addonId,
      addonName: addon.name,
      price: addon.price.toString(),
    });

    return { success: true, addon, price: addon.price };
  }

  async deactivateAddon(hotelId: string, addonId: string, userId?: string): Promise<any> {
    const addon = await this.prisma.client.addon.findUnique({
      where: { id: addonId },
    });
    if (!addon) throw new NotFoundException('Add-on não encontrado');

    const hotelAddon = await this.prisma.client.hotelAddon.findUnique({
      where: { hotelId_addonId: { hotelId, addonId } },
    });
    if (!hotelAddon || !hotelAddon.isActive) throw new BadRequestException('Add-on não está ativo');

    await this.prisma.client.hotelAddon.update({
      where: { hotelId_addonId: { hotelId, addonId } },
      data: { isActive: false, removedAt: new Date() },
    });

    // Remover módulo do enabledModules
    const hotel = await this.prisma.client.hotel.findUnique({
      where: { id: hotelId },
    });
    if (hotel?.enabledModules?.includes(addon.moduleKey)) {
      const modules = hotel.enabledModules.filter((m: string) => m !== addon.moduleKey);
      await this.prisma.client.hotel.update({
        where: { id: hotelId },
        data: { enabledModules: modules },
      });
    }

    await this.createBillingLog(hotelId, 'ADDON_DEACTIVATED', `Add-on "${addon.name}" desativado`, {
      addonId,
      addonName: addon.name,
    });

    return { success: true };
  }

  /**
   * Tenta cobrar todas as faturas pendentes (máx 5 tentativas cada)
   */
  async chargePendingInvoices(): Promise<number> {
    const pendingInvoices = await this.prisma.client.systemInvoice.findMany({
      where: {
        status: 'PENDENTE',
        attemptCount: { lt: 5 },
      },
      orderBy: { dueDate: 'asc' },
      take: 100,
    });

    let charged = 0;
    for (const inv of pendingInvoices) {
      try {
        const result = await this.processInvoicePayment(inv.id);
        if (result.status === 'approved' || result.status === 'in_process') {
          charged++;
        }
      } catch (err) {
        this.logger.warn(`Erro ao cobrar fatura ${inv.id}:`, err);
        continue;
      }
    }
    return charged;
  }

  // ============================================================
  //  MÉTRICAS MRR / CHURN
  // ============================================================

  async getMrrMetrics() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // MRR atual
    const activeHotels = await this.prisma.client.hotel.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: { mrr: true, plan: true, createdAt: true, nome: true },
    });

    const totalMRR = activeHotels.reduce((sum: number, h: any) => sum + h.mrr, 0);
    const mrrByPlan: Record<string, number> = {};
    for (const h of activeHotels) {
      mrrByPlan[h.plan] = (mrrByPlan[h.plan] || 0) + h.mrr;
    }

    // MRR mês passado
    const lastMonthActive = await this.prisma.client.hotel.findMany({
      where: {
        status: 'ACTIVE',
        createdAt: { lte: lastMonthEnd },
      },
      select: { mrr: true },
    });
    const lastMonthMRR = lastMonthActive.reduce((sum: number, h: any) => sum + h.mrr, 0);

    // Churn
    const churnedThisMonth = await this.prisma.client.hotel.count({
      where: {
        status: 'CHURNED',
        updatedAt: { gte: monthStart },
      },
    });
    const totalStartOfMonth = await this.prisma.client.hotel.count({
      where: {
        createdAt: { lt: monthStart },
        status: { not: 'CHURNED' },
      },
    });
    const churnRate = totalStartOfMonth > 0 ? (churnedThisMonth / totalStartOfMonth) * 100 : 0;

    // Novos clientes no mês
    const newClients = await this.prisma.client.hotel.count({
      where: {
        createdAt: { gte: monthStart },
        id: { not: '11111111-1111-1111-1111-111111111111' },
      },
    });

    // Cancelados no mês
    const canceledThisMonth = await this.prisma.client.hotel.findMany({
      where: {
        status: 'CHURNED',
        updatedAt: { gte: monthStart },
      },
      select: { mrr: true },
    });
    const lostMRR = canceledThisMonth.reduce((sum: number, h: any) => sum + h.mrr, 0);

    // MRR por mês (últimos 6 meses)
    const mrrHistory = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const hotelsInMonth = await this.prisma.client.hotel.findMany({
        where: {
          status: { not: 'CHURNED' },
          createdAt: { lte: end },
        },
        select: { mrr: true, updatedAt: true, status: true },
      });

      const mrr = hotelsInMonth.reduce((sum: number, h: any) => sum + h.mrr, 0);
      mrrHistory.push({
        month: start.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        mrr,
      });
    }

    // ARPU
    const arpu = activeHotels.length > 0 ? totalMRR / activeHotels.length : 0;

    // Clientes por plano
    const clientsByPlan: Record<string, number> = {};
    for (const h of activeHotels) {
      clientsByPlan[h.plan] = (clientsByPlan[h.plan] || 0) + 1;
    }

    // Add-ons stats
    const activeAddons = await this.prisma.client.hotelAddon.count({
      where: { isActive: true },
    });
    const addonRevenue = await this.prisma.client.hotelAddon.aggregate({
      where: { isActive: true },
      _sum: { price: true },
    });

    return {
      mrr: {
        current: totalMRR,
        lastMonth: lastMonthMRR,
        growth: lastMonthMRR > 0 ? ((totalMRR - lastMonthMRR) / lastMonthMRR) * 100 : 0,
        history: mrrHistory,
        byPlan: mrrByPlan,
      },
      arr: totalMRR * 12,
      arpu,
      clients: {
        active: activeHotels.length,
        newThisMonth: newClients,
        churnedThisMonth,
      },
      churn: {
        rate: parseFloat(churnRate.toFixed(2)),
        lostMRR,
      },
      plans: {
        distribution: clientsByPlan,
      },
      addons: {
        active: activeAddons,
        revenue: addonRevenue._sum.price || 0,
      },
    };
  }

  // ============================================================
  //  CUPONS
  // ============================================================

  async validateCoupon(code: string, plan?: string): Promise<any> {
    const coupon = await this.prisma.client.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) throw new NotFoundException('Cupom não encontrado');
    if (!coupon.isActive) throw new BadRequestException('Cupom inativo');
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('Cupom já atingiu o limite de usos');
    }
    if (coupon.validUntil && coupon.validUntil < new Date()) {
      throw new BadRequestException('Cupom expirado');
    }
    if (plan && coupon.targetPlans.length > 0 && !coupon.targetPlans.includes(plan)) {
      throw new BadRequestException('Cupom não é válido para este plano');
    }

    return {
      valid: true,
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      discountFixed: coupon.discountFixed,
      description: coupon.description,
    };
  }

  async applyCoupon(couponId: string): Promise<any> {
    const coupon = await this.prisma.client.coupon.findUnique({
      where: { id: couponId },
    });
    if (!coupon) throw new NotFoundException('Cupom não encontrado');

    await this.prisma.client.coupon.update({
      where: { id: couponId },
      data: { usedCount: { increment: 1 } },
    });

    return { success: true };
  }

  // ============================================================
  //  BILLING LOGS
  // ============================================================

  private async createBillingLog(hotelId: string, event: string, detail: string, metadata?: any) {
    return this.prisma.client.billingLog.create({
      data: {
        hotelId,
        event,
        detail,
        metadata: metadata || {},
      },
    });
  }

  async getBillingLogs(hotelId?: string, limit: number = 50) {
    const where: any = {};
    if (hotelId) where.hotelId = hotelId;

    return this.prisma.client.billingLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { hotel: { select: { nome: true } } },
    });
  }
}
