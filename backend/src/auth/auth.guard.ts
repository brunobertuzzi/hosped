import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { TenantService } from '../core/tenant.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly tenantService: TenantService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token não fornecido.');
    }

    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET is not configured');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret,
      });

      // Anexar o usuário logado à requisição
      (request as any)['user'] = payload;

      const tenantContext = this.tenantService.getContext();
      if (tenantContext) {
        tenantContext.hotelId = payload.hotelId;
        tenantContext.branchId = payload.branchId || tenantContext.branchId; // Mantém branchId se já definido ou usa o do token
        tenantContext.userId = payload.sub;
        tenantContext.role = payload.role;
      }
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    // 1. Tentar pegar do header
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer' && token) {
      return token;
    }

    // 2. Tentar pegar do cookie (para segurança httpOnly)
    const cookieHeader = request.headers.cookie;
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map((c) => c.trim());
      const tokenCookie = cookies.find((c) => c.startsWith('token='));
      if (tokenCookie) {
        return tokenCookie.split('=')[1];
      }
    }

    return undefined;
  }
}
