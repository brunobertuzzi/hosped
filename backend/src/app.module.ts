import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from './core/core.module';
import { TenantMiddleware } from './core/tenant.middleware';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { ReservationsModule } from './reservations/reservations.module';
import { RoomsModule } from './rooms/rooms.module';
import { InventoryModule } from './inventory/inventory.module';
import { PaymentsModule } from './payments/payments.module';
import { GuestsModule } from './guests/guests.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { BookingEngineModule } from './booking-engine/booking-engine.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './audit/audit.interceptor';
import { ApiUsageInterceptor } from './core/api-usage.interceptor';

import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ExpensesModule } from './expenses/expenses.module';
import { HousekeepingModule } from './housekeeping/housekeeping.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { MarketingModule } from './marketing/marketing.module';

import { envValidationSchema } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    CacheModule.register({
      isGlobal: true,
      ttl: 60000,
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100, // Limite global de 100 req/minuto
      },
    ]),
    CoreModule,
    AuthModule,
    AuditModule,
    ReservationsModule,
    RoomsModule,
    InventoryModule,
    PaymentsModule,
    GuestsModule,
    IntegrationsModule,
    BookingEngineModule,
    ExpensesModule,
    HousekeepingModule,
    WebhooksModule,
    MarketingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiUsageInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
