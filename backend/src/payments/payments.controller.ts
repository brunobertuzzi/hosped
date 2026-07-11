import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('pix')
  async createPix(@Body() dto: CreatePaymentDto, @Request() req: any) {
    const userId = req.user?.sub;
    const result = await this.paymentsService.createPixPayment(dto, userId);

    return {
      id: result.id,
      qr_code: result.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64:
        result.point_of_interaction?.transaction_data?.qr_code_base64,
    };
  }

  @Get(':id/status')
  async getStatus(@Param('id') id: string) {
    const result = await this.paymentsService.getPaymentStatus(id);
    return {
      id,
      status: result.status,
    };
  }

  @Post('webhook')
  async handleWebhook(@Body() body: any) {
    // Mercado Pago envia { action: "payment.updated", data: { id: "123456" } }
    if (body.type === 'payment' || body.action?.startsWith('payment')) {
      const paymentId = body.data?.id;
      if (paymentId) {
        // Chamamos getPaymentStatus para forçar a checagem no gateway e atualizar o DB
        try {
          await this.paymentsService.getPaymentStatus(paymentId.toString());
        } catch (e) {
          console.warn(
            'Webhook error processing payment:',
            paymentId,
            e.message,
          );
        }
      }
    }
    return { received: true };
  }
}
