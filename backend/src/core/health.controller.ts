import { Controller, Get, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import * as os from 'os';

@Controller('core/health')
@UseGuards(AuthGuard)
export class HealthController {
  
  @Get()
  getHealth(@Request() req: any) {
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

    return {
      status: 'ONLINE',
      cpuUsagePercentage: cpuUsage,
      memoryTotalGB: (totalMem / 1024 / 1024 / 1024).toFixed(2),
      memoryUsedGB: (usedMem / 1024 / 1024 / 1024).toFixed(2),
      memoryUsagePercentage: memUsage,
      postgresStatus: 'ONLINE',
      redisStatus: 'ONLINE'
    };
  }
}
