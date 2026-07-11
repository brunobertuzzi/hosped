import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { WhatsappService } from './whatsapp.service';
import { Logger } from '@nestjs/common';

@Processor('whatsapp-queue')
export class WhatsappProcessor extends WorkerHost {
  private readonly logger = new Logger(WhatsappProcessor.name);

  constructor(private readonly whatsappService: WhatsappService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'send-message': {
        const { hotelId, toPhone, message } = job.data;
        this.logger.log(
          `Processando job assíncrono para WhatsApp de ${toPhone}`,
        );
        return this.whatsappService.sendMessageSync(hotelId, toPhone, message);
      }
      default:
        this.logger.warn(`Job desconhecido: ${job.name}`);
    }
  }
}
