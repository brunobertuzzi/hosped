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
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';

@UseGuards(AuthGuard)
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  findAll() {
    return this.roomsService.findActiveMaintenance();
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('rooms.manage')
  @Post()
  async create(@Body() body: any, @Request() req: any) {
    const userId = req.user?.sub;
    return this.roomsService.createMaintenanceOrder(
      body.roomId,
      body.descricao,
      userId,
    );
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('rooms.manage')
  @Post(':id/complete')
  async complete(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    const userId = req.user?.sub;
    return this.roomsService.completeMaintenanceOrder(
      id,
      body?.observacoes,
      userId,
    );
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('rooms.manage')
  @Put(':id')
  update(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    return this.roomsService.updateMaintenance(id, data, req.user?.sub);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('rooms.manage')
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.roomsService.removeMaintenance(id, req.user?.sub);
  }
}
