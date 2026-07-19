import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ExpenseStatus } from '@prisma/client';

@UseGuards(AuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  findAll() {
    return this.expensesService.findAll();
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('financial.manage')
  @Post()
  create(@Body() data: { descricao: string; valor: number; dataVencimento: string; categoria: string; fornecedor?: string }, @Request() req: any) {
    return this.expensesService.create(data, req.user?.sub);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('financial.manage')
  @Put(':id')
  update(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    return this.expensesService.update(id, data, req.user?.sub);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('financial.manage')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: ExpenseStatus }, @Request() req: any) {
    return this.expensesService.updateStatus(id, body.status, req.user?.sub);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('financial.manage')
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.expensesService.remove(id, req.user?.sub);
  }
}
