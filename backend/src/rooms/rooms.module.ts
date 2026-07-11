import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { MaintenanceController } from './maintenance.controller';

@Module({
  controllers: [RoomsController, MaintenanceController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
