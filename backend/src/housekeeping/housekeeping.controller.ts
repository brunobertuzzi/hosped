import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { HousekeepingService } from './housekeeping.service';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { CleaningStatus } from '@prisma/client';

@UseGuards(AuthGuard)
@Controller('housekeeping')
export class HousekeepingController {
  constructor(private readonly housekeepingService: HousekeepingService) {}

  @Get()
  findAll() {
    return this.housekeepingService.findAll();
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('rooms.manage')
  @Post()
  create(@Body() data: { roomId: string; tipoLimpeza: string; observacoes?: string; responsavelId?: string }, @Request() req: any) {
    return this.housekeepingService.create(data, req.user?.sub);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('rooms.manage')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: CleaningStatus }, @Request() req: any) {
    return this.housekeepingService.updateStatus(id, body.status, req.user?.sub);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('rooms.manage')
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.housekeepingService.remove(id, req.user?.sub);
  }
}
