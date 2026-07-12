import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { PrismaService } from './core/prisma.service';
import { GlobalExceptionFilter } from './core/filters/global-exception.filter';

async function bootstrap() {
  // Validar variáveis de ambiente obrigatórias antes de iniciar
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = requiredEnvVars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    console.error(
      `ERRO FATAL: Variáveis de ambiente obrigatórias ausentes: ${missing.join(', ')}`,
    );
    process.exit(1);
  }
  if (
    process.env.JWT_SECRET === 'troque_por_uma_chave_secreta_forte_32chars+'
  ) {
    console.error(
      'ERRO FATAL: JWT_SECRET ainda está com o valor padrão. Defina um segredo forte antes de subir em produção.',
    );
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);

  // Configuração de CORS para o Frontend
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'https://frontend-production-2b45.up.railway.app',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Segurança HTTP básica
  app.use(helmet());

  // Validação de DTOs global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const prismaService = app.get(PrismaService);
  app.useGlobalFilters(new GlobalExceptionFilter(prismaService));

  // Escutar na porta definida pelo Railway no host 0.0.0.0
  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');
  console.log(`API Hoteleira rodando com sucesso em: http://localhost:${port}`);
}
bootstrap();
