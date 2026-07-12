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
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PrismaService } from './prisma.service';

@Controller('core/plans')
export class PlansController {
  constructor(private readonly prisma: PrismaService) {}

  private checkSuperAdmin(req: any) {
    if (req.user?.role !== 'PLATFORM_OWNER') {
      throw new UnauthorizedException('Acesso restrito ao Super Admin.');
    }
  }

  @Get()
  async getPlans() {
    return await this.prisma.client.systemPlan.findMany({
      orderBy: { price: 'asc' },
    });
  }

  @Post()
  @UseGuards(AuthGuard)
  async createPlan(@Request() req: any, @Body() data: any) {
    this.checkSuperAdmin(req);
    return await this.prisma.client.systemPlan.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        maxBranches: data.maxBranches,
        maxRooms: data.maxRooms,
        maxUsers: data.maxUsers,
        features: data.features || [],
        isActive: data.isActive ?? true,
      },
    });
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updatePlan(
    @Request() req: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    this.checkSuperAdmin(req);
    return await this.prisma.client.systemPlan.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        maxBranches: data.maxBranches,
        maxRooms: data.maxRooms,
        maxUsers: data.maxUsers,
        features: data.features,
        isActive: data.isActive,
      },
    });
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deletePlan(@Request() req: any, @Param('id') id: string) {
    this.checkSuperAdmin(req);
    return await this.prisma.client.systemPlan.delete({
      where: { id },
    });
  }
}
