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
    features: ['Tudo do PRO', 'Filiais ilimitadas', 'Webhooks', 'Suporte prioritário'],
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

  // Seeding GlobalSettings (Singleton)
  try {
    await prisma.globalSettings.upsert({
      where: { id: '1' },
      update: {},
      create: {
        id: '1',
        paymentGateways: [],
        platformName: 'Hosped',
        supportEmail: 'suporte@hosped.com',
        helpCenterUrl: '/guia',
      },
    });
    console.log('Configurações globais (GlobalSettings) inicializadas.');
  } catch (error: any) {
    console.warn(`Aviso: GlobalSettings não foi inicializado - ${error?.message || error}`);
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

  // 3. Criar ou Atualizar "Hotel Praia e Sol" (Tenant Padrão)
  const defaultHotelId = '11111111-1111-1111-1111-111111111111';
  const defaultBranchId = '22222222-2222-2222-2222-222222222222';
  
  await prisma.hotel.upsert({
    where: { id: defaultHotelId },
    update: {
      nome: 'Hotel Praia e Sol',
      razaoSocial: 'Hotel Praia e Sol LTDA',
      email: 'contato@hotelpraiaesol.com.br',
      telefone: '73999887766',
      endereco: 'Av. Beira Mar, 500 - Porto Seguro, BA',
    },
    create: {
      id: defaultHotelId,
      nome: 'Hotel Praia e Sol',
      razaoSocial: 'Hotel Praia e Sol LTDA',
      documentoFiscal: '12.345.678/0001-90',
      email: 'contato@hotelpraiaesol.com.br',
      telefone: '73999887766',
      endereco: 'Av. Beira Mar, 500 - Porto Seguro, BA',
      branches: {
        create: {
          id: defaultBranchId,
          nome: 'Unidade Beira Mar (Matriz)',
          endereco: 'Av. Beira Mar, 500',
          cidade: 'Porto Seguro',
          estado: 'BA',
          telefone: '73999887766',
          email: 'contato@hotelpraiaesol.com.br',
        }
      }
    }
  });
  console.log('Hotel Praia e Sol configurado com sucesso.');

  // Garantir Filial Padrão
  await prisma.branch.upsert({
    where: { id: defaultBranchId },
    update: {
      nome: 'Unidade Beira Mar (Matriz)',
      cidade: 'Porto Seguro',
      estado: 'BA',
    },
    create: {
      id: defaultBranchId,
      hotelId: defaultHotelId,
      nome: 'Unidade Beira Mar (Matriz)',
      endereco: 'Av. Beira Mar, 500',
      cidade: 'Porto Seguro',
      estado: 'BA',
      telefone: '73999887766',
      email: 'contato@hotelpraiaesol.com.br',
    }
  });

  // 4. Seed de Categorias de Quarto
  const catLuxo = await prisma.roomCategory.upsert({
    where: { id: 'c1111111-1111-1111-1111-111111111111' },
    update: {},
    create: {
      id: 'c1111111-1111-1111-1111-111111111111',
      hotelId: defaultHotelId,
      nome: 'Suíte Luxo Vista Mar',
      descricao: 'Suíte master com varanda panorâmica e vista para o oceano.',
      capacidadeMaxima: 2,
      valorBase: 350.0,
      comodidades: ['Ar-condicionado', 'Wi-Fi', 'TV 55"', 'Varanda', 'Frigobar', 'Cama King'],
      fotos: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80']
    }
  });

  const catStandard = await prisma.roomCategory.upsert({
    where: { id: 'c2222222-2222-2222-2222-222222222222' },
    update: {},
    create: {
      id: 'c2222222-2222-2222-2222-222222222222',
      hotelId: defaultHotelId,
      nome: 'Quarto Duplo Standard',
      descricao: 'Quarto aconchegante para casais ou pequenos grupos.',
      capacidadeMaxima: 3,
      valorBase: 220.0,
      comodidades: ['Ar-condicionado', 'Wi-Fi', 'TV 43"', 'Cama Queen'],
      fotos: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80']
    }
  });

  const catChale = await prisma.roomCategory.upsert({
    where: { id: 'c3333333-3333-3333-3333-333333333333' },
    update: {},
    create: {
      id: 'c3333333-3333-3333-3333-333333333333',
      hotelId: defaultHotelId,
      nome: 'Chalé Família Praia',
      descricao: 'Chalé privativo próximo à praia com cozinha equipada.',
      capacidadeMaxima: 5,
      valorBase: 480.0,
      comodidades: ['Ar-condicionado', 'Wi-Fi', 'Cozinha', 'Churrasqueira', 'Rede de Descanso'],
      fotos: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80']
    }
  });
  console.log('Categorias de quarto seedadas.');

  // 5. Seed de Quartos Físicos
  const roomsToSeed = [
    { id: 'r101-1111-1111-1111-111111111111', numero: '101', categoryId: catLuxo.id, status: 'DISPONIVEL' as const },
    { id: 'r102-1111-1111-1111-111111111111', numero: '102', categoryId: catLuxo.id, status: 'DISPONIVEL' as const },
    { id: 'r103-1111-1111-1111-111111111111', numero: '103', categoryId: catStandard.id, status: 'DISPONIVEL' as const },
    { id: 'r104-1111-1111-1111-111111111111', numero: '104', categoryId: catStandard.id, status: 'DISPONIVEL' as const },
    { id: 'r201-1111-1111-1111-111111111111', numero: '201 (Chalé 1)', categoryId: catChale.id, status: 'DISPONIVEL' as const },
    { id: 'r202-1111-1111-1111-111111111111', numero: '202 (Chalé 2)', categoryId: catChale.id, status: 'DISPONIVEL' as const },
  ];

  for (const r of roomsToSeed) {
    await prisma.room.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        hotelId: defaultHotelId,
        branchId: defaultBranchId,
        categoryId: r.categoryId,
        numero: r.numero,
        status: r.status,
      }
    });
  }
  console.log('Quartos físicos seedados.');

  // 6. Seed de Hóspedes de Exemplo
  const guestsToSeed = [
    { id: 'g1111111-1111-1111-1111-111111111111', nome: 'Carlos Eduardo Oliveira', documento: '033.998.520-88', email: 'carlos.eduardo@email.com', telefone: '(71) 99887-1122' },
    { id: 'g2222222-2222-2222-2222-222222222222', nome: 'Mariana Silva Santos', documento: '123.456.789-00', email: 'mariana.silva@email.com', telefone: '(11) 98765-4321' },
    { id: 'g3333333-3333-3333-3333-333333333333', nome: 'Roberto Mendes Ferreira', documento: '987.654.321-11', email: 'roberto.mendes@email.com', telefone: '(21) 97654-3210' },
  ];

  for (const g of guestsToSeed) {
    await prisma.guest.upsert({
      where: { id: g.id },
      update: {},
      create: {
        id: g.id,
        hotelId: defaultHotelId,
        nome: g.nome,
        documento: g.documento,
        email: g.email,
        telefone: g.telefone,
      }
    });
  }
  console.log('Hóspedes de exemplo seedados.');

  // 7. Seed de Estoque / Produtos
  const inventoryToSeed = [
    { id: 'i1111111-1111-1111-1111-111111111111', nome: 'Água Mineral 500ml', categoria: 'Bebidas', valorVenda: 6.0, valorCusto: 1.5, quantidade: 60, estoqueMinimo: 10, unidade: 'UN' },
    { id: 'i2222222-2222-2222-2222-222222222222', nome: 'Cerveja Heineken Long Neck', categoria: 'Bebidas', valorVenda: 14.0, valorCusto: 5.0, quantidade: 40, estoqueMinimo: 15, unidade: 'UN' },
    { id: 'i3333333-3333-3333-3333-333333333333', nome: 'Refrigerante Coca-Cola Lata', categoria: 'Bebidas', valorVenda: 8.0, valorCusto: 2.8, quantidade: 50, estoqueMinimo: 12, unidade: 'UN' },
    { id: 'i4444444-4444-4444-4444-444444444444', nome: 'Porção de Batata Frita', categoria: 'Restaurante', valorVenda: 35.0, valorCusto: 8.0, quantidade: 30, estoqueMinimo: 5, unidade: 'UN' },
    { id: 'i5555555-5555-5555-5555-555555555555', nome: 'Kit Boas-Vindas (Chocolates)', categoria: 'Cortesia', valorVenda: 0.0, valorCusto: 12.0, quantidade: 25, estoqueMinimo: 5, unidade: 'UN' },
  ];

  for (const inv of inventoryToSeed) {
    await prisma.inventoryItem.upsert({
      where: { id: inv.id },
      update: {},
      create: {
        id: inv.id,
        hotelId: defaultHotelId,
        branchId: defaultBranchId,
        nome: inv.nome,
        categoria: inv.categoria,
        valorVenda: inv.valorVenda,
        valorCusto: inv.valorCusto,
        quantidade: inv.quantidade,
        estoqueMinimo: inv.estoqueMinimo,
        unidade: inv.unidade,
      }
    });
  }
  console.log('Itens de estoque seedados.');

  // 8. Seed de Cupons de Desconto
  const promoCodesToSeed = [
    { id: 'p1111111-1111-1111-1111-111111111111', codigo: 'PRAIA10', descricao: '10% de desconto em reservas diretas', tipoDesconto: 'PERCENTUAL', valorDesconto: 10.0, quantidadeTotal: 50, ativo: true },
    { id: 'p2222222-2222-2222-2222-222222222222', codigo: 'BEMVINDO50', descricao: 'R$ 50 OFF na primeira hospedagem', tipoDesconto: 'FIXO', valorDesconto: 50.0, quantidadeTotal: 20, ativo: true },
  ];

  for (const promo of promoCodesToSeed) {
    await prisma.promoCode.upsert({
      where: { id: promo.id },
      update: {},
      create: {
        id: promo.id,
        hotelId: defaultHotelId,
        codigo: promo.codigo,
        descricao: promo.descricao,
        tipoDesconto: promo.tipoDesconto,
        valorDesconto: promo.valorDesconto,
        quantidadeTotal: promo.quantidadeTotal,
        ativo: promo.ativo,
      }
    });
  }
  console.log('Cupons promocionais seedados.');

  // Atualizar Super Admin para pertencer a este hotel para visualização inicial
  await prisma.user.update({
    where: { email: superAdminEmail },
    data: { hotelId: defaultHotelId, branchId: defaultBranchId }
  });
  console.log('Super Admin vinculado ao Hotel Praia e Sol.');


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
