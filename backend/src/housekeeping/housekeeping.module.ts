import { Module } from '@nestjs/common';
import { HousekeepingController } from './housekeeping.controller';
import { HousekeepingService } from './housekeeping.service';
import { HousekeepingGateway } from './housekeeping.gateway';

@Module({
  controllers: [HousekeepingController],
  providers: [HousekeepingService, HousekeepingGateway],
})
export class HousekeepingModule {}
