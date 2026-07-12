import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private prisma: PrismaService) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: any =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Erro Interno do Servidor';

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status = HttpStatus.BAD_REQUEST;
        const target = exception.meta?.target || 'campo único';
        message = {
          message: `O valor informado já está cadastrado no sistema.`,
        };
      }
    }

    const errorMessage =
      typeof message === 'object' ? JSON.stringify(message) : String(message);
    const stackTrace = exception instanceof Error ? exception.stack : undefined;

    // Tentar pegar o hotelId e userId do token (se o usuário estiver logado)
    let hotelId = undefined;
    let userId = undefined;
    const reqAny = request as any;
    if (reqAny.user) {
      if (reqAny.user.hotelId) hotelId = reqAny.user.hotelId;
      if (reqAny.user.sub) userId = reqAny.user.sub;
    }

    // Apenas logar erros sérios (500)
    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} - ${errorMessage}`,
        stackTrace,
      );
      try {
        await this.prisma.client.systemErrorLog.create({
          data: {
            hotelId,
            userId,
            route: request.url,
            method: request.method,
            statusCode: status,
            errorMessage,
            stackTrace,
          },
        });
      } catch (logError) {
        this.logger.error(
          'Falha ao salvar log de erro no banco de dados',
          logError,
        );
      }
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: status >= 500 ? 'Erro interno no servidor' : message,
    });
  }
}
