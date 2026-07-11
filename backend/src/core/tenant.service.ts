import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  hotelId: string;
  branchId?: string;
  userId?: string;
  role?: string;
}

@Injectable()
export class TenantService {
  private static readonly asyncLocalStorage =
    new AsyncLocalStorage<TenantContext>();

  /**
   * Executa uma função dentro do contexto do tenant especificado
   */
  run(context: TenantContext, fn: () => any) {
    return TenantService.asyncLocalStorage.run(context, fn);
  }

  /**
   * Retorna o contexto atual do tenant, se existir
   */
  getContext(): TenantContext | undefined {
    return TenantService.asyncLocalStorage.getStore();
  }

  /**
   * Retorna o hotelId do contexto atual
   */
  getHotelId(): string | undefined {
    return this.getContext()?.hotelId;
  }

  /**
   * Retorna o branchId do contexto atual (se aplicável)
   */
  getBranchId(): string | undefined {
    return this.getContext()?.branchId;
  }

  /**
   * Retorna o userId do contexto atual
   */
  getUserId(): string | undefined {
    return this.getContext()?.userId;
  }

  /**
   * Retorna a role do usuário no contexto atual
   */
  getUserRole(): string | undefined {
    return this.getContext()?.role;
  }
}
