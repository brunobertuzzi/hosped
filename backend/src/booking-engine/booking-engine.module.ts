import { Module } from '@nestjs/common';
import { BookingEngineService } from './booking-engine.service';
import { BookingEngineController } from './booking-engine.controller';
import { CoreModule } from '../core/core.module';

@Module({
  imports: [CoreModule],
  providers: [BookingEngineService],
  controllers: [BookingEngineController],
})
export class BookingEngineModule {}
