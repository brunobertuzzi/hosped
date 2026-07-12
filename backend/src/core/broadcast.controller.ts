import { Controller, Get, Post, Body, UseGuards, Request, UnauthorizedException, Put } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';

// In-memory state for simplicity, ideally should be in DB (e.g., Settings table)
let globalMaintenanceMode = false;

@Controller('core/broadcast')
@UseGuards(AuthGuard)
export class BroadcastController {
  
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
}
