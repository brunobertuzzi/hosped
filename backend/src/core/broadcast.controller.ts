import { Controller, Get, Post, Body, UseGuards, Request, UnauthorizedException, Put, Param, Delete } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PrismaService } from './prisma.service';

// In-memory state for simplicity, ideally should be in DB (e.g., Settings table)
let globalMaintenanceMode = false;

@Controller('core/broadcast')
@UseGuards(AuthGuard)
export class BroadcastController {
  
  constructor(private readonly prisma: PrismaService) {}

  @Get('maintenance')
  getMaintenanceMode() {
    return { maintenanceMode: globalMaintenanceMode };
  }

  @Put('maintenance')
  setMaintenanceMode(@Body() body: { maintenanceMode: boolean }, @Request() req: any) {
    if (req.user.role !== 'PLATFORM_OWNER') {
      throw new UnauthorizedException('Acesso negado.');
    }
    globalMaintenanceMode = body.maintenanceMode;
    return { success: true, maintenanceMode: globalMaintenanceMode };
  }

  // ================= ANNOUNCEMENTS =================

  @Get('announcements')
  async getAnnouncements(@Request() req: any) {
    return this.prisma.client.systemAnnouncement.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  @Post('announcements')
  async createAnnouncement(@Body() body: any, @Request() req: any) {
    if (req.user.role !== 'PLATFORM_OWNER') {
      throw new UnauthorizedException('Acesso negado.');
    }
    return this.prisma.client.systemAnnouncement.create({
      data: {
        title: body.title,
        content: body.content,
        type: body.type || 'INFO',
        isActive: body.isActive ?? true,
        targetPlans: body.targetPlans || [],
      }
    });
  }

  @Put('announcements/:id')
  async updateAnnouncement(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    if (req.user.role !== 'PLATFORM_OWNER') {
      throw new UnauthorizedException('Acesso negado.');
    }
    return this.prisma.client.systemAnnouncement.update({
      where: { id },
      data: {
        title: body.title,
        content: body.content,
        type: body.type,
        isActive: body.isActive,
        targetPlans: body.targetPlans,
      }
    });
  }

  @Delete('announcements/:id')
  async deleteAnnouncement(@Param('id') id: string, @Request() req: any) {
    if (req.user.role !== 'PLATFORM_OWNER') {
      throw new UnauthorizedException('Acesso negado.');
    }
    return this.prisma.client.systemAnnouncement.delete({
      where: { id }
    });
  }
}

