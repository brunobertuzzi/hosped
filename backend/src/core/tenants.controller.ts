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
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PrismaService } from './prisma.service';
import { AuthService } from '../auth/auth.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Controller('core/tenants')
@UseGuards(AuthGuard)
export class TenantsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  private checkSuperAdmin(req: any) {
    if (req.user.role !== 'PLATFORM_OWNER') {
      throw new UnauthorizedException('Acesso restrito ao Super Admin.');
    }
  }

  @Get()
  async getTenants(@Request() req: any) {
    this.checkSuperAdmin(req);
    const hotels = await this.prisma.client.hotel.findMany({
      include: {
        _count: {
          select: { branches: true },
        },
        users: {
          where: { role: 'HOTEL_OWNER' },
          select: { email: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return hotels.map((hotel: any) => ({
      id: hotel.id,
      name: hotel.nome,
      document: hotel.documentoFiscal,
      email: hotel.users[0]?.email || hotel.email,
      plan: hotel.plan,
      status: hotel.status,
      mrr: hotel.mrr,
      createdAt: hotel.createdAt,
      branchesCount: hotel._count.branches,
      nextBillingDate: hotel.nextBillingDate,
      storageUsedMB: hotel.storageUsedMB,
      storageLimitMB: hotel.storageLimitMB,
      apiRequestsCount: hotel.apiRequestsCount,
      apiRequestsLimit: hotel.apiRequestsLimit,
      enabledModules: hotel.enabledModules,
    }));
  }

  @Get('system-logs')
  async getSystemLogs(@Request() req: any) {
    this.checkSuperAdmin(req);
    return this.prisma.client.systemErrorLog.findMany({
      include: {
        hotel: { select: { nome: true } },
        user: { select: { nome: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  @Post('seed-default')
  async seedDefaultHotel(@Request() req: any) {
    this.checkSuperAdmin(req);
    const defaultHotelId = '11111111-1111-1111-1111-111111111111';
    const defaultBranchId = '22222222-2222-2222-2222-222222222222';

    let existingHotel = await this.prisma.client.hotel.findUnique({
      where: { id: defaultHotelId },
    });
    if (!existingHotel) {
      try {
        existingHotel = await this.prisma.client.hotel.create({
          data: {
            id: defaultHotelId,
            nome: 'Hotel Seed',
            razaoSocial: 'Hotel Seed LTDA',
            documentoFiscal: `00.000.000/${Date.now().toString().slice(-4)}-00`,
            email: `seed-${Date.now()}@hotelexemplo.com`,
            telefone: '11000000000',
            endereco: 'Seed',
            diferenciais: [],
            branches: {
              create: {
                id: defaultBranchId,
                nome: 'Matriz',
                endereco: 'Seed',
                cidade: 'São Paulo',
                estado: 'SP',
                telefone: '11000000000',
                email: `seed-${Date.now()}@hotelexemplo.com`,
              },
            },
          },
        });
      } catch (e: any) {
        return { success: false, error: e.message || String(e) };
      }
    }

    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    if (!superAdminEmail) {
      return { success: false, error: 'SUPER_ADMIN_EMAIL não configurado nas variáveis de ambiente.' };
    }
    await this.prisma.client.user.updateMany({
      where: { email: superAdminEmail },
      data: { hotelId: defaultHotelId, branchId: defaultBranchId },
    });

    return { success: true, hotel: existingHotel };
  }

  @Post()
  async createTenant(@Body() body: any, @Request() req: any) {
    this.checkSuperAdmin(req);
    // Gerar senha aleatória se não fornecida
    const tempPassword = body.password || crypto.randomBytes(6).toString('hex');
    // Reutilizar a logica de registro do AuthService, mas forçando plano e MRR
    const res = await this.authService.register({
      companyName: body.name,
      companyDoc: body.document,
      email: body.email,
      userName: 'Administrador',
      password: tempPassword,
    });

    if (res.success && res.hotelId) {
      await this.prisma.client.hotel.update({
        where: { id: res.hotelId },
        data: {
          plan: body.plan,
          mrr: body.mrr,
          status: 'ACTIVE',
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          enabledModules: body.enabledModules || body.features || [],
        },
      });
    }

    return res;
  }

  @Put('settings')
  async updateSettings(@Body() body: any, @Request() req: any) {
    const hotelId = req.user?.hotelId;
    if (!hotelId) {
      throw new BadRequestException('Usuário não associado a um hotel.');
    }
    const hotel = await this.prisma.client.hotel.update({
      where: { id: hotelId },
      data: {
        nome: body.nome,
        cores: body.cores,
        slogan: body.slogan !== undefined ? body.slogan : undefined,
        descricaoPublica:
          body.descricaoPublica !== undefined
            ? body.descricaoPublica
            : undefined,
        diferenciais:
          body.diferenciais !== undefined ? body.diferenciais : undefined,
        slug: body.slug !== undefined ? body.slug : undefined,
      },
    });
    return hotel;
  }

  @Put(':id')
  async updateTenant(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    this.checkSuperAdmin(req);
    const hotel = await this.prisma.client.hotel.update({
      where: { id },
      data: {
        plan: body.plan,
        mrr: body.mrr !== undefined ? body.mrr : undefined,
        nome: body.name !== undefined ? body.name : undefined,
        email: body.email !== undefined ? body.email : undefined,
        enabledModules: body.enabledModules ?? body.features ?? undefined,
      },
    });
    return hotel;
  }

  @Put(':id/status')
  async updateTenantStatus(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    this.checkSuperAdmin(req);
    const hotel = await this.prisma.client.hotel.update({
      where: { id },
      data: {
        status: body.status,
        mrr: body.status === 'CHURNED' ? 0 : undefined,
      },
    });
    return hotel;
  }

  @Put(':id/modules')
  async updateTenantModules(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    this.checkSuperAdmin(req);
    const hotel = await this.prisma.client.hotel.update({
      where: { id },
      data: {
        enabledModules: body.enabledModules,
      },
    });
    return hotel;
  }

  @Delete(':id')
  async deleteTenant(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    this.checkSuperAdmin(req);

    const { password } = body;
    if (!password) {
      throw new BadRequestException(
        'A senha do administrador é obrigatória para excluir um Tenant.',
      );
    }

    const admin = await this.prisma.client.user.findUnique({
      where: { id: req.user.sub },
    });

    if (!admin) {
      throw new UnauthorizedException('Administrador não encontrado.');
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      throw new UnauthorizedException('Senha incorreta. Exclusão cancelada.');
    }

    try {
      // Exclui o hotel. Assumindo que onDelete: Cascade está configurado no Prisma schema
      // ou que a exclusão vai funcionar para os relacionamentos associados.
      await this.prisma.client.hotel.delete({
        where: { id },
      });
      return { success: true, message: 'Tenant excluído com sucesso.' };
    } catch (error) {
      throw new BadRequestException(
        'Erro ao excluir tenant: Pode haver dados vinculados que impedem a exclusão automática.',
      );
    }
  }
}
