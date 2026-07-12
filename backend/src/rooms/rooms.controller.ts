import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  // Scoped via AuthGuard
  @UseGuards(AuthGuard)
  @Get()
  async findAllRooms() {
    return this.roomsService.findAllRooms();
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('rooms.manage')
  @Post()
  async createRoom(@Body() data: any, @Request() req: any) {
    return this.roomsService.createRoom(
      data,
      req.user?.branchId,
      req.user?.sub,
    );
  }

  // Scoped via AuthGuard
  @UseGuards(AuthGuard)
  @Get('categories')
  async findAllCategories() {
    return this.roomsService.findAllCategories();
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('rooms.manage')
  @Post('categories')
  async createCategory(@Body() data: any, @Request() req: any) {
    return this.roomsService.createCategory(data, req.user?.sub);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('rooms.manage')
  @Post(':id/cleaning-complete')
  async completeCleaning(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.sub;
    return this.roomsService.completeCleaning(id, userId);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('rooms.manage')
  @Put(':id')
  async updateRoom(
    @Param('id') id: string,
    @Body() data: any,
    @Request() req: any,
  ) {
    return this.roomsService.updateRoom(id, data, req.user?.sub);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('rooms.manage')
  @Delete(':id')
  async removeRoom(@Param('id') id: string, @Request() req: any) {
    return this.roomsService.removeRoom(id, req.user?.sub);
  }
}
