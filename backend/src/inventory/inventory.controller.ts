import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Post,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AuthGuard } from '../auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async findAll() {
    return this.inventoryService.findAll();
  }

  @UseGuards(AuthGuard)
  @Post()
  async create(@Body() data: any, @Request() req: any) {
    return this.inventoryService.create(
      data,
      req.user?.branchId,
      req.user?.sub,
    );
  }

  @UseGuards(AuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: any,
    @Request() req: any,
  ) {
    return this.inventoryService.update(id, data, req.user?.sub);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.inventoryService.remove(id, req.user?.sub);
  }
}
