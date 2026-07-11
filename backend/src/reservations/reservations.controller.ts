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
  Query,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { CheckInDto } from './dto/check-in.dto';
import { AddConsumptionDto } from './dto/add-consumption.dto';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  // Public booking endpoint (hotel/branch scoped via ?hotelId=...&branchId=... query or headers; no auth required for self-service)
  @Post()
  async create(@Body() createDto: CreateReservationDto, @Request() req: any) {
    const userId = req.user?.sub; // may be undefined for public
    return this.reservationsService.createReservation(createDto, userId);
  }

  @UseGuards(AuthGuard)
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    if (page && limit) {
      return this.reservationsService.findAllPaginated(
        parseInt(page),
        parseInt(limit),
        status,
      );
    }
    return this.reservationsService.findAll(status);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('reservations.edit')
  @Post(':id/check-in')
  async checkIn(
    @Param('id') id: string,
    @Body() checkInDto: CheckInDto,
    @Request() req: any,
  ) {
    const userId = req.user?.sub;
    return this.reservationsService.checkIn(id, checkInDto, userId);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('inventory.manage')
  @Post(':id/consumption')
  async addConsumption(
    @Param('id') id: string,
    @Body() addConsumptionDto: AddConsumptionDto,
    @Request() req: any,
  ) {
    const userId = req.user?.sub;
    return this.reservationsService.addConsumption(
      id,
      addConsumptionDto,
      userId,
    );
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('reservations.edit')
  @Post(':id/check-out')
  async checkOut(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.sub;
    return this.reservationsService.checkOut(id, userId);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('reservations.cancel')
  @Post(':id/cancel')
  async cancelReservation(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.sub;
    return this.reservationsService.cancelReservation(id, userId);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('reservations.edit')
  @Put(':id')
  async updateReservation(
    @Param('id') id: string,
    @Body() data: any,
    @Request() req: any,
  ) {
    return this.reservationsService.updateReservation(id, data, req.user?.sub);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('reservations.cancel')
  @Delete(':id')
  async deleteReservation(@Param('id') id: string, @Request() req: any) {
    return this.reservationsService.deleteReservation(id, req.user?.sub);
  }
}
