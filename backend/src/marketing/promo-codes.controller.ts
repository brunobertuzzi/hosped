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
import { PromoCodesService } from './promo-codes.service';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';

@Controller('promo-codes')
export class PromoCodesController {
  constructor(private readonly promoCodesService: PromoCodesService) {}

  @Get('validate/:hotelId/:code')
  async validatePublic(
    @Param('hotelId') hotelId: string,
    @Param('code') code: string,
  ) {
    return this.promoCodesService.validate(hotelId, code);
  }

  @UseGuards(AuthGuard)
  @Get()
  async findAll(@Request() req: any) {
    return this.promoCodesService.findAll(req.user?.hotelId);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('marketing.manage')
  @Post()
  async create(@Body() data: any, @Request() req: any) {
    return this.promoCodesService.create(data, req.user?.hotelId, req.user?.sub);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('marketing.manage')
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: any,
    @Request() req: any,
  ) {
    return this.promoCodesService.update(id, data, req.user?.hotelId, req.user?.sub);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('marketing.manage')
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.promoCodesService.remove(id, req.user?.hotelId, req.user?.sub);
  }
}
