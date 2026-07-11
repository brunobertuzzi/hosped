# 🏨 Hosped

**Plataforma SaaS de Gestão Hoteleira Multi-Filiais (PMS)**

Sistema completo para gestão de hotéis, pousadas e redes hoteleiras com suporte a múltiplas filiais, reservas online, controle de estoque, financeiro, governança, e integrações com OTAs.

## 🚀 Stack

| Componente | Tecnologia |
|------------|-----------|
| **Frontend** | Next.js 16, React 19, TailwindCSS 4, Zustand |
| **Backend** | NestJS 11, Prisma 7 |
| **Banco de Dados** | PostgreSQL 15 |
| **Cache / Filas** | Redis 7 |
| **Pagamentos** | Mercado Pago (PIX, Cartão) |
| **Deploy** | Railway (Docker) |

## 📁 Estrutura

```
hosped/
├── backend/          # API REST (NestJS)
│   ├── prisma/       # Schema e migrações
│   └── src/          # Código fonte
│       ├── auth/         # Autenticação JWT
│       ├── core/         # Core multi-tenant, planos
│       ├── rooms/        # Quartos e manutenção
│       ├── reservations/ # Reservas e check-in/out
│       ├── guests/       # Hóspedes
│       ├── payments/     # Pagamentos (Mercado Pago)
│       ├── inventory/    # Estoque
│       ├── expenses/     # Despesas
│       ├── housekeeping/ # Governança
│       ├── ical/         # Sincronização iCal (OTAs)
│       ├── webhooks/     # Webhooks
│       └── integrations/ # WhatsApp, Google
├── frontend/         # Aplicação Next.js
│   └── src/
│       ├── app/          # App Router (admin, super-admin, público)
│       ├── components/   # Componentes reutilizáveis
│       ├── lib/          # Utilitários
│       └── store/        # Zustand stores
└── docker-compose.yml # Infra local (PostgreSQL + Redis)
```

## 🛠️ Desenvolvimento Local

### Pré-requisitos
- Node.js >= 18
- Docker e Docker Compose

### Passos

```bash
# 1. Configure as variáveis de ambiente
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 2. Suba a infraestrutura local
docker-compose up -d

# 3. Instale as dependências
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 4. Execute as migrações do banco
cd backend
npx prisma generate
npx prisma migrate dev
cd ..

# 5. Inicie o projeto (2 terminais)
npm run dev:backend
npm run dev:frontend
```

### Scripts da Raiz

| Comando | Descrição |
|---------|-----------|
| `npm run dev:backend` | Inicia API em modo dev (porta 3001) |
| `npm run dev:frontend` | Inicia Frontend em modo dev (porta 3000) |
| `npm run install:all` | Instala dependências de ambos os projetos |
| `npm run build:backend` | Compila o backend |
| `npm run build:frontend` | Compila o frontend |

## 🌐 Deploy no Railway

1. Crie dois serviços no Railway (backend + frontend)
2. Adicione os plugins PostgreSQL e Redis
3. Configure as variáveis de ambiente em cada serviço
4. Faça o deploy pelos `railway.json` já configurados

> **Importante:** Em produção, as variáveis de ambiente devem ser configuradas diretamente no Railway, nunca commitadas no repositório.

## 📄 Licença

Este projeto é privado e de uso exclusivo do proprietário.
| `npm run dev:backend` | Inicia o Backend em modo dev |
| `npm run dev:frontend` | Inicia o Frontend em modo dev |
| `npm run install:all` | Instala dependências do front e back |
| `npm run build:backend` | Build de produção do backend |
| `npm run build:frontend` | Build de produção do frontend |

## Deploy em Produção (Railway)

A arquitetura atual foi projetada para deploy automatizado (CI/CD) utilizando o **Railway** como PaaS (modelo de Monorepo).

### Passo a passo

1. Crie um projeto no [Railway](https://railway.app/)
2. Adicione os plugins integrados de **PostgreSQL** e **Redis**
3. Adicione o serviço de **Backend**:
   - Conecte o GitHub; em Settings configure **Root Directory** → `/backend`
   - Em **Variables**, cadastre:
     ```
     DATABASE_URL       → obtida automaticamente do plugin PostgreSQL
     REDIS_HOST         → obtida automaticamente do plugin Redis
     REDIS_PORT         → 6379
     JWT_SECRET         → gere com: openssl rand -base64 64
     FRONTEND_URL       → URL pública do frontend (após deploy)
     SUPER_ADMIN_EMAIL  → seu email de admin
     SUPER_ADMIN_PASSWORD → senha forte
     SISTEMA_PAYMENT_TOKEN → token do Mercado Pago (se billing ativo)
     ```
4. Adicione o serviço de **Frontend**:
   - Conecte o GitHub; em Settings configure **Root Directory** → `/frontend`
   - Em **Variables**, cadastre:
     ```
     NEXT_PUBLIC_API_URL → URL pública do backend (ex: https://backend-xxx.railway.app)
     ```

### O que acontece no startup do backend
O container executa automaticamente, nesta ordem:
1. `prisma migrate deploy` — aplica todas as migrations pendentes
2. `node dist_seed/seed.js` — cria os planos do sistema e o super admin (idempotente: não apaga dados)
3. `node dist/src/main.js` — inicia o servidor

### Health check
- Endpoint: `GET /health` → `{ status: "ok", timestamp: "..." }`

> **Nota de Segurança:** Nunca commite arquivos `.env` com valores reais. Cadastre os segredos sempre na aba "Variables" de cada serviço dentro do painel do Railway.

> **Upload de arquivos:** Em produção, os arquivos enviados ficam em `/tmp/uploads` (efêmero). Para persistência, migre para um object storage (S3, Cloudflare R2, Supabase Storage).

## Melhorias Recentes
- Campo `status` adicionado ao modelo User (com migration) + correções em equipe/auth/seed.
- Removido Prisma client v5 inútil do frontend (evita conflitos de versão).
- Corrigidos headers de tenant e fluxo de onboarding/registro.
- Rotas de manutenção consolidadas (agora consistentes em /maintenance).
- **Portal público de reservas funcional**: cria reservas reais via API (sem auth para self-service), PIX linkado, carregamento de dados por hotelId via query.
- Guards relaxados seletivamente para permitir bookings públicos.
- **Campos públicos do hotel** adicionados ao schema: `slogan`, `descricaoPublica`, `diferenciais`.
- **Seed idempotente**: não apaga dados existentes; cria super admin e planos apenas se ausentes.
- **Health check**: `GET /health` para monitoramento.
- **Validação de env vars** no startup: falha rápida se `DATABASE_URL` ou `JWT_SECRET` estiverem ausentes.
