import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Res,
  NotFoundException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { IcalService } from './ical.service';
import type { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';

@Controller('ical')
export class IcalController {
  constructor(private readonly icalService: IcalService) {}

  // Export URL for OTA (Booking/Airbnb) to fetch
  @Get('export/:token.ics')
  async exportIcal(@Param('token') token: string, @Res() res: Response) {
    const calendarString = await this.icalService.generateExport(token);
    if (!calendarString) {
      throw new NotFoundException('Calendar not found');
    }

    res.set({
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="calendar-${token}.ics"`,
    });
    return res.send(calendarString);
  }

  // Trigger manual import sync for a specific IcalSync
  @Post('sync/:id')
  async syncManual(@Param('id') id: string) {
    return this.icalService.syncIcalUrls(id);
  }

  @UseGuards(AuthGuard)
  @Get('settings')
  async getSettings(@Request() req: any) {
    return this.icalService.getSettings(req.hotelId);
  }

  @UseGuards(AuthGuard)
  @Post('settings')
  async saveSettings(@Request() req: any, @Body() data: any) {
    return this.icalService.saveSettings(req.hotelId, data);
  }
}
