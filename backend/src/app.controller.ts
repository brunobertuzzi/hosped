import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './core/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  healthCheck() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('public/hotel/:id')
  async getPublicHotel(@Param('id') id: string) {
    const hotel = await this.prisma.client.hotel.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        logo: true,
        banner: true,
        cores: true,
        razaoSocial: true,
        documentoFiscal: true,
        slogan: true,
        descricaoPublica: true,
        diferenciais: true,
      },
    });

    if (!hotel) {
      throw new NotFoundException('Hotel não encontrado');
    }

    const branches = await this.prisma.client.branch.findMany({
      where: { hotelId: id },
    });

    return {
      hotel,
      branches,
    };
  }
}
