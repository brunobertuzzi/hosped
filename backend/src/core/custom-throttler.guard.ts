import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  /**
   * Extrai a chave de rastreamento única (IP real do cliente + Usuário se autenticado)
   * Trata corretamente cabeçalhos de Proxy/Cloudflare (x-forwarded-for, cf-connecting-ip)
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const rawIp =
      req.headers['cf-connecting-ip'] ||
      req.headers['x-forwarded-for'] ||
      req.headers['x-real-ip'] ||
      req.ip ||
      req.socket?.remoteAddress ||
      req.connection?.remoteAddress ||
      '127.0.0.1';

    const clientIp = Array.isArray(rawIp)
      ? rawIp[0]
      : typeof rawIp === 'string'
      ? rawIp.split(',')[0].trim()
      : '127.0.0.1';

    const userId = req.user?.sub || req.user?.id;
    if (userId) {
      return `${clientIp}:user:${userId}`;
    }

    return `${clientIp}`;
  }

  /**
   * Mensagem amigável padronizada em Português para erro HTTP 429
   */
  protected async throwThrottlingException(
    context: ExecutionContext,
  ): Promise<void> {
    throw new ThrottlerException(
      'Muitas requisições enviadas em pouco tempo. O sistema limitou seu acesso temporariamente para evitar sobrecarga. Por favor, aguarde alguns segundos.',
    );
  }
}
