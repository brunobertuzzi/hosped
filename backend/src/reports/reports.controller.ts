import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  Logger,
  Req,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { ReportsService } from './reports.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('reports')
@UseGuards(AuthGuard)
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(private readonly reportsService: ReportsService) {}

  /**
   * GET /reports/daily-summary?hotelId=X&date=YYYY-MM-DD
   * Retorna JSON com resumo operacional e financeiro do dia.
   */
  @Get('daily-summary')
  async getDailySummary(
    @Query('hotelId') hotelId: string,
    @Query('date') date: string,
    @Req() req: Request,
  ) {
    // Fallback: extrair hotelId do header tenant se não for fornecido
    const effectiveHotelId = hotelId || (req as any).hotelId;
    if (!effectiveHotelId) {
      return { error: 'hotelId é obrigatório como query param ou via header x-hotel-id.' };
    }

    this.logger.log(`daily-summary chamado para hotel ${effectiveHotelId} data ${date || 'hoje'}`);
    const data = date || new Date().toISOString().split('T')[0];

    return await this.reportsService.getDailySummary(effectiveHotelId, data);
  }

  /**
   * GET /reports/export/financeiro?hotelId=X&startDate=Y&endDate=Z
   * Retorna CSV com dados financeiros do período.
   */
  @Get('export/financeiro')
  async exportFinanceiroCsv(
    @Query('hotelId') hotelId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const effectiveHotelId = hotelId || (req as any).hotelId;
    if (!effectiveHotelId || !startDate || !endDate) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios: hotelId, startDate, endDate.',
      });
    }

    const csv = await this.reportsService.exportFinanceiroCsv(
      effectiveHotelId,
      startDate,
      endDate,
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="financeiro_${startDate}_a_${endDate}.csv"`,
    );
    // BOM para acentos no Excel
    res.send('\ufeff' + csv);
  }

  /**
   * GET /reports/export/reservas?hotelId=X&startDate=Y&endDate=Z
   * Retorna CSV com dados de reservas do período.
   */
  @Get('export/reservas')
  async exportReservasCsv(
    @Query('hotelId') hotelId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const effectiveHotelId = hotelId || (req as any).hotelId;
    if (!effectiveHotelId || !startDate || !endDate) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios: hotelId, startDate, endDate.',
      });
    }

    const csv = await this.reportsService.exportReservasCsv(
      effectiveHotelId,
      startDate,
      endDate,
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="reservas_${startDate}_a_${endDate}.csv"`,
    );
    res.send('\ufeff' + csv);
  }
}