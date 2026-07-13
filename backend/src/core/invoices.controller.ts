import { Controller, Get, Post, Param, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
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
    return this.prisma.client.systemInvoice.findMany({
      orderBy: { createdAt: 'desc' },
      include: { hotel: true },
    });
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
}
