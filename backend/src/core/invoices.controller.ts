import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PrismaService } from './prisma.service';

@Controller('core/invoices')
@UseGuards(AuthGuard)
export class InvoicesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getInvoices(@Request() req: any) {
    if (req.user.role !== 'PLATFORM_OWNER') {
      throw new UnauthorizedException('Acesso negado.');
    }
    const invoices = await this.prisma.client.systemInvoice.findMany({
      orderBy: { createdAt: 'desc' },
      include: { hotel: true },
    });

    const result = [];
    for (const inv of invoices) {
      let amount = Number(inv.amount);
      if (amount === 0) {
        const plan = inv.hotel?.plan || 'PRO';
        if (plan === 'ENTERPRISE') amount = 599.0;
        else if (plan === 'STARTER') amount = 149.0;
        else amount = 299.0;

        try {
          await this.prisma.client.systemInvoice.update({
            where: { id: inv.id },
            data: { amount },
          });
        } catch (e) {
          // ignore
        }
      }
      result.push({ ...inv, amount });
    }

    return result;
  }

  @Post(':id/simulate-payment')
  async simulatePayment(@Param('id') id: string, @Request() req: any) {
    if (req.user.role !== 'PLATFORM_OWNER') {
      throw new UnauthorizedException('Acesso negado.');
    }
    return this.prisma.client.systemInvoice.update({
      where: { id },
      data: {
        status: 'PAGO',
        paidAt: new Date(),
      },
    });
  }

  @Delete(':id')
  async deleteInvoice(@Param('id') id: string, @Request() req: any) {
    if (req.user.role !== 'PLATFORM_OWNER') {
      throw new UnauthorizedException('Acesso negado.');
    }
    await this.prisma.client.systemInvoice.delete({ where: { id } });
    return { success: true };
  }
}
