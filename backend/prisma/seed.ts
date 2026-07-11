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
  try {
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
  } catch (error: any) {
    // Pode ocorrer na primeira execução se as migrations ainda não foram
    // totalmente propagadas (ex: Railway reiniciou antes da migration concluir).
    // O servidor continua funcionando normalmente sem os planos.
    console.warn(`Aviso: planos do sistema não foram sincronizados - ${error?.message || error}`);
    console.warn('O servidor iniciará normalmente. Os planos serão criados no próximo restart.');
  }

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
    console.log(`Super admin já existe (${superAdminEmail}). Forçando atualização da senha para garantir acesso...`);
    const newPasswordHash = await bcrypt.hash(superAdminPassword, 10);
    await prisma.user.update({
      where: { email: superAdminEmail },
      data: { password: newPasswordHash },
    });
    console.log('Senha do Super Admin redefinida com sucesso.');
  } else {
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
  }

  // 3. Criar Hotel de Exemplo e vincular
  const defaultHotelId = '11111111-1111-1111-1111-111111111111';
  const defaultBranchId = '22222222-2222-2222-2222-222222222222';
  
  const existingHotel = await prisma.hotel.findUnique({ where: { id: defaultHotelId } });
  if (!existingHotel) {
    console.log('Criando Hotel de Exemplo (Tenant Padrão)...');
    await prisma.hotel.create({
      data: {
        id: defaultHotelId,
        nome: 'Hotel Exemplo',
        razaoSocial: 'Hotel Exemplo LTDA',
        documentoFiscal: '00.000.000/0001-00',
        email: 'contato@hotelexemplo.com',
        telefone: '11999999999',
        endereco: 'Rua das Flores, 123',
        branches: {
          create: {
            id: defaultBranchId,
            nome: 'Matriz',
            endereco: 'Rua das Flores, 123',
            cidade: 'São Paulo',
            estado: 'SP',
            telefone: '11999999999',
            email: 'contato@hotelexemplo.com',
          }
        }
      }
    });
  }

  // Atualizar Super Admin para pertencer a este hotel para visualização inicial
  await prisma.user.update({
    where: { email: superAdminEmail },
    data: { hotelId: defaultHotelId, branchId: defaultBranchId }
  });
  console.log('Super Admin vinculado ao Hotel de Exemplo.');


  console.log('Seed finalizado com sucesso!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error('Erro no seed (não fatal):', e?.message || e);
    console.log('Seed finalizado com avisos. O servidor continuará iniciando.');
    await prisma.$disconnect();
    await pool.end();
  });
