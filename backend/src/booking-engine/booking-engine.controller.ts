import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { BookingEngineService } from './booking-engine.service';

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

  @Post(':hotelId/:branchId/reserve')
  reserve(
    @Param('hotelId') hotelId: string,
    @Param('branchId') branchId: string,
    @Body() dto: any,
  ) {
    return this.bookingEngineService.publicReserve(hotelId, branchId, dto);
  }
}
