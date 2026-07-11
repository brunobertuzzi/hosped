import { Module } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { CoreModule } from '../core/core.module';
import { BullModule } from '@nestjs/bullmq';

import { WhatsappService } from './whatsapp.service';
import { WhatsappListener } from './listeners/whatsapp.listener';
import { WhatsappProcessor } from './whatsapp.processor';

@Module({
  imports: [
    CoreModule,
    BullModule.registerQueue({
      name: 'whatsapp-queue',
    }),
  ],
  providers: [
    IntegrationsService,
    WhatsappService,
    WhatsappListener,
    WhatsappProcessor,
  ],
  controllers: [IntegrationsController],
  exports: [IntegrationsService, WhatsappService],
})
export class IntegrationsModule {}
