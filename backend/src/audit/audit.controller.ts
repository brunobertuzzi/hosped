import {
  Controller,
  Get,
  UseGuards,
  Query,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PrismaService } from '../core/prisma.service';

@Controller('audit')
@UseGuards(AuthGuard)
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getLogs(
    @Query('tenantId') tenantId: string | undefined,
    @Request() req: any,
  ) {
    if (req.user.role !== 'PLATFORM_OWNER' && req.user.role !== 'HOTEL_OWNER') {
      throw new UnauthorizedException('Acesso negado.');
    }
    const where: any = {};
    if (tenantId) {
      where.hotelId = tenantId;
    }

    const logs = await this.prisma.client.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        hotel: { select: { nome: true } },
        user: { select: { nome: true, email: true } },
      },
    });

    return logs;
  }
}
