import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { TenantService } from './tenant.service';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  private adapter: PrismaPg;
  private baseClient: PrismaClient;

  // Cliente estendido com as regras automáticas de Tenant Isolation
  public client: any;

  constructor(private readonly tenantService: TenantService) {
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL ||
      process.env.SUPABASE_DB_URL;
    if (!connectionString) {
      throw new Error(
        'Uma variável de ambiente de banco de dados (DATABASE_URL, POSTGRES_PRISMA_URL, etc) é obrigatória.',
      );
    }

    // Inicializar o pool do node-postgres (pg)
    this.pool = new Pool({ connectionString });
    this.adapter = new PrismaPg(this.pool);
    this.baseClient = new PrismaClient({ adapter: this.adapter });

    // Configurar extensão global para isolamento multi-tenant no Prisma 7
    this.client = this.baseClient.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const _args = args as any;

            // Ignorar isolamento se for o modelo Hotel, pois ele não possui hotelId (a chave primária é id)
            // e o controle de acesso é feito nos controllers.
            if (model === 'Hotel' || model === 'SystemPlan') {
              return query(args);
            }

            const context = tenantService.getContext();
            const hotelId = context?.hotelId;
            const role = context?.role;

            // Super admin (PLATFORM_OWNER) tem acesso irrestrito a todos os tenants.
            // A injeção automática de hotelId é pulada para que ele possa buscar de qualquer hotel.
            if (role === 'PLATFORM_OWNER') {
              return query(args);
            }

            if (hotelId) {
              // 1. Injetar hotelId em consultas de leitura/atualização/remoção
              if (_args.where !== undefined) {
                _args.where = { ..._args.where, hotelId };
              } else if (
                [
                  'findMany',
                  'findFirst',
                  'findUnique',
                  'findFirstOrThrow',
                  'findUniqueOrThrow',
                  'update',
                  'delete',
                  'updateMany',
                  'deleteMany',
                  'count',
                  'aggregate',
                  'groupBy',
                ].includes(operation)
              ) {
                _args.where = { hotelId };
              }

              // 2. Injetar hotelId em inserções de novos registros
              if (operation === 'create') {
                if (_args.data) {
                  _args.data = { ..._args.data, hotelId };
                }
              }

              if (operation === 'createMany') {
                if (_args.data) {
                  if (Array.isArray(_args.data)) {
                    _args.data = _args.data.map((item: any) => ({
                      ...item,
                      hotelId,
                    }));
                  } else {
                    _args.data = { ..._args.data, hotelId };
                  }
                }
              }

              // 3. Injetar hotelId em upserts
              if (operation === 'upsert') {
                if (_args.create) _args.create = { ..._args.create, hotelId };
                if (_args.update) _args.update = { ..._args.update, hotelId };
                if (_args.where) _args.where = { ..._args.where, hotelId };
              }
            } else {
              // Se não há hotelId no contexto e o usuário não é PLATFORM_OWNER, 
              // forçamos um ID inválido para não vazar dados de outros tenants.
              const fakeHotelId = 'INVALID_TENANT_ID_NO_ACCESS';
              if (_args.where !== undefined) {
                _args.where = { ..._args.where, hotelId: fakeHotelId };
              } else if (
                [
                  'findMany',
                  'findFirst',
                  'findUnique',
                  'findFirstOrThrow',
                  'findUniqueOrThrow',
                  'update',
                  'delete',
                  'updateMany',
                  'deleteMany',
                  'count',
                  'aggregate',
                  'groupBy',
                ].includes(operation)
              ) {
                _args.where = { hotelId: fakeHotelId };
              }
              if (operation === 'create' && _args.data) {
                _args.data = { ..._args.data, hotelId: fakeHotelId };
              }
            }

            return query(_args);
          },
        },
      },
    });
  }

  async onModuleInit() {
    // Conectar ao banco
    await this.baseClient.$connect();
  }

  async onModuleDestroy() {
    // Desconectar o Prisma e fechar o pool de conexões do pg
    await this.baseClient.$disconnect();
    await this.pool.end();
  }
}
