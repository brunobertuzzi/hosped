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
  Query,
} from '@nestjs/common';
import { GuestsService } from './guests.service';
import { AuthGuard } from '../auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('guests')
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Post()
  async create(@Body() data: any, @Request() req: any) {
    return this.guestsService.create(data, req.user?.sub);
  }

  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    if (page && limit) {
      return this.guestsService.findAll(Number(page), Number(limit));
    }
    return this.guestsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.guestsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    return this.guestsService.update(id, data, req.user?.sub);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.guestsService.remove(id, req.user?.sub);
  }
}
