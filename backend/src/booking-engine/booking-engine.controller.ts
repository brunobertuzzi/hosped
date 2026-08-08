import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { BookingEngineService } from './booking-engine.service';
import { Throttle } from '@nestjs/throttler';

@Controller('booking-engine')
export class BookingEngineController {
  constructor(private readonly bookingEngineService: BookingEngineService) {}

  @Get('public/hotel/:hotelId')
  getPublicHotelData(@Param('hotelId') hotelId: string) {
    return this.bookingEngineService.getPublicHotelData(hotelId);
  }

  @Get(':hotelId/:branchId/availability')
  checkAvailability(
    @Param('hotelId') hotelId: string,
    @Param('branchId') branchId: string,
    @Query('checkIn') checkIn: string,
    @Query('checkOut') checkOut: string,
  ) {
    return this.bookingEngineService.checkAvailability(
      hotelId,
      branchId,
      checkIn,
      checkOut,
    );
  }

  @Throttle({ short: { limit: 5, ttl: 10000 }, medium: { limit: 15, ttl: 60000 } })
  @Post(':hotelId/:branchId/reserve')
  reserve(
    @Param('hotelId') hotelId: string,
    @Param('branchId') branchId: string,
    @Body() dto: any,
  ) {
    return this.bookingEngineService.publicReserve(hotelId, branchId, dto);
  }
}
