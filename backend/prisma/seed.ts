import { PrismaClient, Role } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as bcrypt from 'bcrypt';

// Tenta carregar .env de múltiplos caminhos possíveis (local vs Docker)
const envPaths = [
  path.join(__dirname, '..', '..', '.env'),       // local: backend/
  path.join(__dirname, '..', '.env'),              // Docker: /app/
  path.join(__dirname, '..', '..', '..', '.env'),  // raiz do monorepo
];
for (const p of envPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required. Set it in the root .env');
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ==========================================
// PLANOS DO SISTEMA (Sistema)
// ==========================================
const SYSTEM_PLANS = [
  {
    name: 'STARTUP',
    description: 'Para hotéis de pequeno porte',
    price: 150.0,
    maxBranches: 1,
    maxRooms: 20,
    maxUsers: 5,
    features: ['Reservas', 'Hóspedes', 'Relatórios básicos'],
    isActive: true,
  },
  {
    name: 'PRO',
    description: 'Para hotéis em crescimento',
    price: 350.0,
    maxBranches: 3,
    maxRooms: 100,
    maxUsers: 20,
    features: ['Reservas', 'Hóspedes', 'Estoque', 'Housekeeping', 'Relatórios avançados', 'Motor de Reservas'],
    isActive: true,
  },
  {
    name: 'ENTERPRISE',
    description: 'Para redes hoteleiras',
    price: 1500.0,
    maxBranches: -1,
    maxRooms: -1,
    maxUsers: -1,
    features: ['Tudo do PRO', 'Filiais ilimitadas', 'iCal / OTA', 'Webhooks', 'Suporte prioritário'],
    isActive: true,
  },
];

async function main() {
  console.log('Iniciando seed idempotente...');

  // 1. Seed dos planos do sistema (sempre seguro — usa upsert)
  for (const plan of SYSTEM_PLANS) {
    await prisma.systemPlan.upsert({
      where: { name: plan.name },
      update: {
        description: plan.description,
        price: plan.price,
        maxBranches: plan.maxBranches,
        maxRooms: plan.maxRooms,
        maxUsers: plan.maxUsers,
        features: plan.features,
        isActive: plan.isActive,
      },
      create: plan,
    });
  }
  console.log('Planos do sistema sincronizados.');

  // 2. Criar Super Admin apenas se não existir
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (!superAdminEmail || !superAdminPassword) {
    console.warn('SUPER_ADMIN_EMAIL ou SUPER_ADMIN_PASSWORD não definidos. Pulando criação do super admin.');
    return;
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (existingAdmin) {
    console.log(`Super admin já existe (${superAdminEmail}). Nenhuma ação necessária.`);
    return;
  }

  const passwordHash = await bcrypt.hash(superAdminPassword, 10);

  await prisma.user.create({
    data: {
      nome: 'Super Admin',
      email: superAdminEmail,
      password: passwordHash,
      role: Role.PLATFORM_OWNER,
      permissions: ['*'],
      status: 'ATIVO',
    },
  });

  console.log(`Super admin criado: ${superAdminEmail}`);
  console.log('Seed finalizado com sucesso!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
