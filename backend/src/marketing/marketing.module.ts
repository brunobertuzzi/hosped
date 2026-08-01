import { Module } from '@nestjs/common';
import { PromoCodesController } from './promo-codes.controller';
import { PromoCodesService } from './promo-codes.service';
import { CoreModule } from '../core/core.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [CoreModule, AuditModule],
  controllers: [PromoCodesController],
  providers: [PromoCodesService],
  exports: [PromoCodesService],
})
export class MarketingModule {}
