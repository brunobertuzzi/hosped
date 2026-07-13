import { Controller, Get, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PrismaService } from './prisma.service';
import { Redis } from 'ioredis';
import * as os from 'os';

@Controller('core/health')
@UseGuards(AuthGuard)
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getHealth(@Request() req: any) {
    if (req.user.role !== 'PLATFORM_OWNER') {
      throw new UnauthorizedException('Somente Super Admin pode ver a saúde do servidor.');
    }

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsage = (usedMem / totalMem) * 100;

    const cpus = os.cpus();
    const loadAvg = os.loadavg()[0]; 
    const cpuUsage = Math.min((loadAvg / cpus.length) * 100, 100);

    let postgresStatus = 'OFFLINE';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      postgresStatus = 'ONLINE';
    } catch (e) {
      postgresStatus = 'OFFLINE';
    }

    let redisStatus = 'OFFLINE';
    let redisClient: Redis | null = null;
    try {
      const redisUrl = process.env.REDIS_URL;
      if (redisUrl) {
        redisClient = new Redis(redisUrl, { maxRetriesPerRequest: 1, connectTimeout: 1000 });
      } else {
        const host = process.env.REDIS_HOST || process.env.REDISHOST || 'localhost';
        const port = Number(process.env.REDIS_PORT || process.env.REDISPORT) || 6379;
        const password = process.env.REDIS_PASSWORD || process.env.REDISPASSWORD || undefined;
        redisClient = new Redis({ host, port, password, maxRetriesPerRequest: 1, connectTimeout: 1000 });
      }
      
      const ping = await redisClient.ping();
      if (ping === 'PONG') {
        redisStatus = 'ONLINE';
      }
    } catch (e) {
      redisStatus = 'OFFLINE';
    } finally {
      if (redisClient) {
        redisClient.disconnect();
      }
    }

    return {
      status: 'ONLINE',
      cpuUsagePercentage: cpuUsage,
      memoryTotalGB: (totalMem / 1024 / 1024 / 1024).toFixed(2),
      memoryUsedGB: (usedMem / 1024 / 1024 / 1024).toFixed(2),
      memoryUsagePercentage: memUsage,
      postgresStatus,
      redisStatus
    };
  }
}
