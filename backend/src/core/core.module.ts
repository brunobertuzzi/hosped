import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TenantService } from './tenant.service';
import { TenantMetricsController } from './tenant-metrics.controller';
import { TenantsController } from './tenants.controller';
import { AuthService } from '../auth/auth.service';
import { AuthModule } from '../auth/auth.module';
import { JwtService } from '@nestjs/jwt';

import { UploadService } from './upload/upload.service';
import { UploadController } from './upload/upload.controller';
import { BillingTask } from './tasks/billing.task';
import { InvoicesController } from './invoices.controller';

import { PlansController } from './plans.controller';
import { HealthController } from './health.controller';
import { BroadcastController } from './broadcast.controller';
import { FeatureFlagsController } from './feature-flags.controller';

@Global()
@Module({
  imports: [AuthModule],
  controllers: [
    TenantMetricsController,
    TenantsController,
    UploadController,
    InvoicesController,
    PlansController,
    HealthController,
    BroadcastController,
    FeatureFlagsController,
  ],
  providers: [
    PrismaService,
    TenantService,
    UploadService,
    BillingTask,
  ],
  exports: [PrismaService, TenantService, UploadService],
})
export class CoreModule {}
