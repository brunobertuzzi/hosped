import {
  Controller,
  Get,
  UseGuards,
  Param,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PrismaService } from './prisma.service';

@Controller('core/tenant-metrics')
@UseGuards(AuthGuard)
export class TenantMetricsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':hotelId')
  async getMetrics(@Param('hotelId') hotelId: string, @Request() req: any) {
    // Apenas PLATFORM_OWNER pode ver métricas isoladas de qualquer tenant nesta rota
    if (req.user.role !== 'PLATFORM_OWNER') {
      throw new UnauthorizedException('Acesso restrito ao Super Admin.');
    }

    const [usersCount, roomsCount, reservationsCount, guestsCount] =
      await Promise.all([
        this.prisma.client.user.count({ where: { hotelId } }),
        this.prisma.client.room.count({ where: { hotelId } }),
        this.prisma.client.reservation.count({ where: { hotelId } }),
        this.prisma.client.guest.count({ where: { hotelId } }),
      ]);

    return {
      usersCount,
      roomsCount,
      reservationsCount,
      guestsCount,
    };
  }
}
