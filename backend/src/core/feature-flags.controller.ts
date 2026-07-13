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
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PrismaService } from './prisma.service';

@Controller('core/feature-flags')
@UseGuards(AuthGuard)
export class FeatureFlagsController {
  constructor(private readonly prisma: PrismaService) {}

  private checkSuperAdmin(req: any) {
    if (req.user.role !== 'PLATFORM_OWNER') {
      throw new UnauthorizedException('Acesso restrito ao Super Admin.');
    }
  }

  @Get()
  async getFeatureFlags(@Request() req: any) {
    this.checkSuperAdmin(req);
    return this.prisma.client.featureFlag.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post()
  async createFeatureFlag(@Body() body: any, @Request() req: any) {
    this.checkSuperAdmin(req);
    return this.prisma.client.featureFlag.create({
      data: {
        name: body.name,
        description: body.description,
        isEnabled: body.isEnabled || false,
        tenantIds: body.tenantIds || [],
      },
    });
  }

  @Put(':id')
  async updateFeatureFlag(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    this.checkSuperAdmin(req);
    return this.prisma.client.featureFlag.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        isEnabled: body.isEnabled,
        tenantIds: body.tenantIds,
      },
    });
  }

  @Delete(':id')
  async deleteFeatureFlag(@Param('id') id: string, @Request() req: any) {
    this.checkSuperAdmin(req);
    return this.prisma.client.featureFlag.delete({
      where: { id },
    });
  }
}
