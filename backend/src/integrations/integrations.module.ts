import { Module } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { CoreModule } from '../core/core.module';

import { WhatsappService } from './whatsapp.service';
import { WhatsappListener } from './listeners/whatsapp.listener';

@Module({
  imports: [CoreModule],
  providers: [IntegrationsService, WhatsappService, WhatsappListener],
  controllers: [IntegrationsController],
  exports: [IntegrationsService, WhatsappService],
})
export class IntegrationsModule {}
