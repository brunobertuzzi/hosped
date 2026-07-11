# Guia de Deploy — Hosped no Railway

> **Documentação oficial de deploy**
> Projeto: Hosped — Plataforma de Gestão Hoteleira Multi-Filiais
> Stack: NestJS 11 + Prisma 7 + PostgreSQL + Redis + Next.js 16 + React 19

---

## Índice

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Preparação do Projeto Antes do Deploy](#2-preparação-do-projeto-antes-do-deploy)
3. [Configuração do GitHub](#3-configuração-do-github)
4. [Configuração do Railway](#4-configuração-do-railway)
5. [Deploy do Backend](#5-deploy-do-backend)
6. [Deploy do Frontend](#6-deploy-do-frontend)
7. [Banco de Dados](#7-banco-de-dados)
8. [Comunicação Frontend/Backend](#8-comunicação-frontendbackend)
9. [Deploy Contínuo (CI/CD)](#9-deploy-contínuo-cicd)
10. [Segurança em Produção](#10-segurança-em-produção)
11. [Troubleshooting](#11-troubleshooting)
12. [Checklist Final de Publicação](#12-checklist-final-de-publicação)

---

## 1. Visão Geral da Arquitetura

### 1.1 Conceito de Monorepo

Um **monorepo** (monolithic repository) é uma estratégia onde múltiplos projetos — como backend e frontend — residem em um **único repositório Git**, organizados em pastas separadas. Isso difere de ter um repositório para cada serviço (polyrepo).

**Vantagens do monorepo para este projeto:**

- 🚀 **Facilidade de gerenciamento**: um único `git clone`, um único `pull request`
- 🔗 **Consistência**: commits atômicos que alteram backend e frontend juntos
- 🔄 **Compartilhamento**: tipos, interfaces e configurações comuns (quando aplicável)
- 👁️ **Visibilidade**: toda a equipe vê o estado completo do sistema

**Desvantagem (mitigada pelo Railway):** O Railway permite que cada serviço aponte para uma subpasta específica do repositório, resolvendo o principal desafio do monorepo: fazer deploy seletivo.

### 1.2 Diagrama da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                      GitHub Repository                       │
│                        (Monorepo)                            │
│  ┌──────────────────────┐  ┌──────────────────────────────┐ │
│  │     /backend          │  │     /frontend                │ │
│  │   NestJS + Prisma    │  │   Next.js + React + Tailwind │ │
│  └──────────┬───────────┘  └─────────────┬────────────────┘ │
└─────────────┼──────────────────────────────┼─────────────────┘
              │                              │
              ▼                              ▼
     ┌─────────────────┐          ┌───────────────────┐
     │   Railway Service │          │   Railway Service  │
     │    (Backend)      │          │    (Frontend)      │
     │   porta 3001      │◄────────►│   porta 3000       │
     │   api.dominio.app │   CORS   │   app.dominio.app  │
     └──────┬────────────┘          └───────────────────┘
            │
            ▼
     ┌─────────────────┐
     │   PostgreSQL     │
     │   (Railway       │
     │    Plugin)       │
     └─────────────────┘
            │
            ▼
     ┌─────────────────┐
     │   Redis          │
     │   (Railway       │
     │    Plugin)       │
     └─────────────────┘
```

### 1.3 Fluxo de Comunicação

1. **Usuário** acessa `app.dominio.app` (Frontend no Railway)
2. **Frontend** (Next.js) faz requisições AJAX para `api.dominio.app` (Backend no Railway)
3. **Backend** (NestJS) processa a requisição, consulta o PostgreSQL e/ou Redis
4. **Resposta** retorna do Backend → Frontend → Usuário
5. **GitHub** dispara deploy automático quando há `git push` na branch principal

---

## 2. Preparação do Projeto Antes do Deploy

Antes de qualquer deploy, o projeto precisa estar configurado corretamente. Abaixo, as verificações necessárias em cada camada.

### 2.1 Verificações no Backend

#### a) Porta dinâmica (`process.env.PORT`)

O Railway define a porta dinamicamente. O backend **nunca** deve usar porta fixa. Verifique em `main.ts`:

```typescript
// ✅ Correto — usa PORT da variável de ambiente com fallback local
const port = process.env.PORT ?? 3001;
await app.listen(port, '0.0.0.0');
```

#### b) Healthcheck endpoint

O Railway verifica se o serviço está vivo. O backend precisa expor uma rota `/health`:

```typescript
// src/app.controller.ts
@Get('/health')
healthCheck() {
  return { status: 'ok', timestamp: new Date().toISOString() };
}
```

#### c) Tratamento de erros global

Um filtro global de exceções garante que erros não quebrem o serviço. O projeto já possui `GlobalExceptionFilter`.

#### d) CORS configurado

O backend deve permitir requisições do frontend em produção:

```typescript
// main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
});
```

#### e) Prisma e migrações

- O schema do Prisma deve estar em `prisma/schema.prisma`
- As migrações devem estar em `prisma/migrations/` (versionadas no Git)
- O Dockerfile precisa executar `prisma migrate deploy` antes de iniciar

### 2.2 Verificações no Frontend

#### a) Build de produção

O Next.js precisa gerar o build `standalone` para Docker. No `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  // ...
};
```

#### b) Variáveis de ambiente do lado do cliente

Toda variável que precisa ser exposta ao navegador deve usar o prefixo `NEXT_PUBLIC_`:

```env
NEXT_PUBLIC_API_URL=https://api.seu-projeto.railway.app
```

#### c) Middleware de autenticação

O middleware do Next.js protege rotas administrativas e verifica a presença do token JWT:

```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isAuthRoute = request.nextUrl.pathname.startsWith('/admin')
    || request.nextUrl.pathname.startsWith('/super-admin');
  if (isAuthRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}
```

### 2.3 Configuração dos `package.json`

#### Backend (`backend/package.json`)

```json
{
  "scripts": {
    "build": "nest build",
    "start:prod": "node dist/src/main.js",
    "postinstall": "prisma generate"
  }
}
```

- `postinstall`: executa `prisma generate` automaticamente após `npm install`
- `start:prod`: deve apontar para o arquivo compilado em `dist/`

#### Frontend (`frontend/package.json`)

```json
{
  "scripts": {
    "dev": "next dev --webpack",
    "build": "next build",
    "start": "next start"
  }
}
```

### 2.4 Organização das Pastas

A estrutura esperada pelo Railway é:

```
hosped/                          # Repositório raiz (monorepo)
├── backend/                     # Serviço 1 no Railway
│   ├── package.json
│   ├── Dockerfile
│   ├── railway.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       └── ...
├── frontend/                    # Serviço 2 no Railway
│   ├── package.json
│   ├── Dockerfile
│   ├── railway.json
│   └── src/
│       ├── app/
│       └── ...
├── docker-compose.yml           # Apenas para desenvolvimento local
├── .gitignore
└── README.md
```

### 2.5 Testes Locais Antes do Deploy

Antes de publicar, execute localmente para validar:

```bash
# 1. Build do backend
cd backend && npm run build && cd ..

# 2. Build do frontend
cd frontend && npm run build && cd ..

# 3. Teste o Docker localmente (opcional)
docker compose up -d          # Sobe PostgreSQL + Redis
cd backend
docker build -t hosped-backend .
docker run -p 3001:3001 --env-file .env hosped-backend
```

---

## 3. Configuração do GitHub

### 3.1 Criar o Repositório

1. Acesse [github.com/new](https://github.com/new)
2. Nome do repositório: `hosped` (ou o nome do seu projeto)
3. Escolha **Privado** ou **Público**
4. **Não** inicialize com README, .gitignore ou license (já temos)
5. Clique em **Create repository**

### 3.2 Enviar o Projeto

```bash
# Já existe um repositório remoto configurado? Verifique:
git remote -v

# Se precisar adicionar ou trocar o remote:
git remote add origin https://github.com/seu-usuario/hosped.git

# Enviar o código
git push -u origin main
```

### 3.3 Fluxo de Atualização

```bash
# 1. Verifique o status
git status

# 2. Adicione as alterações
git add .

# 3. Crie um commit descritivo
git commit -m "feat: adiciona módulo de relatórios financeiros"

# 4. Envie para o GitHub
git push origin main
```

### 3.4 Boas Práticas de Branches

| Branch | Finalidade | Base |
|--------|-----------|------|
| `main` | Produção (estável) | — |
| `develop` | Integração de features | `main` |
| `feature/nome` | Desenvolvimento de funcionalidade | `develop` |
| `fix/nome` | Correção de bugs | `develop` ou `main` |
| `hotfix/nome` | Correção urgente em produção | `main` |

**Fluxo recomendado:**

```bash
git checkout -b feature/novo-modulo develop
# ... desenvolve ...
git add . && git commit -m "feat: ..."
git checkout develop && git merge feature/novo-modulo
git push origin develop
# Após aprovação: merge develop → main
git checkout main && git merge develop && git push origin main
```

---

## 4. Configuração do Railway

### 4.1 Criar Conta no Railway

1. Acesse [railway.app](https://railway.app)
2. Clique em **Login with GitHub** (use a mesma conta do GitHub do repositório)
3. Autorize a aplicação Railway
4. Complete o cadastro

### 4.2 Integração com GitHub

O Railway precisa de permissão para acessar seus repositórios:

1. No dashboard do Railway, clique no ícone do usuário (canto superior direito)
2. Vá em **Authorized GitHub Apps**
3. Verifique se o Railway tem acesso ao repositório `hosped`
4. Se não tiver, clique em **Configure** e adicione o repositório

### 4.3 Criar o Projeto no Railway

1. No dashboard, clique em **New Project**
2. Selecione **Deploy from GitHub repo**
3. Escolha o repositório `hosped`
4. O Railway detectará automaticamente o projeto — **mas vamos configurar manualmente cada serviço**

### 4.4 Criar o Serviço do Backend

1. Dentro do projeto Railway, clique em **New** → **Service** → **Add GitHub Repo**
2. Selecione o mesmo repositório `hosped`
3. Configure:

| Configuração | Valor |
|-------------|-------|
| **Root Directory** | `backend/` |
| **Build Command** | (usará o Dockerfile) |
| **Start Command** | (usará o Dockerfile) |

4. Clique em **Deploy**

> ⚠️ O Railway detecta automaticamente o `Dockerfile` dentro do `backend/` e usa as configurações do `railway.json`.

### 4.5 Criar o Serviço do Frontend

1. Clique em **New** → **Service** → **Add GitHub Repo**
2. Selecione o mesmo repositório `hosped`
3. Configure:

| Configuração | Valor |
|-------------|-------|
| **Root Directory** | `frontend/` |
| **Build Command** | (usará o Dockerfile) |
| **Start Command** | (usará o Dockerfile) |

4. Clique em **Deploy**

### 4.6 Diferenças entre os Dois Serviços

| Característica | Backend | Frontend |
|----------------|---------|----------|
| **Root Directory** | `backend/` | `frontend/` |
| **Tecnologia** | NestJS (servidor Node.js) | Next.js (SSR + SPA) |
| **Porta** | 3001 | 3000 |
| **Healthcheck** | `/health` | `/` |
| **Precisa de banco?** | Sim (PostgreSQL + Redis) | Não |
| **Público?** | Não (apenas o frontend acessa) | Sim |
| **Domínio** | `api.seu-projeto.railway.app` | `seu-projeto.railway.app` |

> 💡 **Dica:** No Railway, você pode gerar domínios personalizados para cada serviço. O padrão é `{projeto}.railway.app`. Recomenda-se criar um subdomínio como `api.{projeto}.railway.app` para o backend.

---

## 5. Deploy do Backend

### 5.1 Instalação das Dependências

O Railway executa automaticamente:

```bash
npm ci --omit=dev --ignore-scripts   # No runtime (Docker multi-stage)
```

O `postinstall` no `package.json` garante que o Prisma Client seja gerado:

```bash
"postinstall": "prisma generate"
```

### 5.2 Variáveis de Ambiente

No Railway, acesse o serviço do backend → **Variables** e adicione:

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `DATABASE_URL` | URL de conexão PostgreSQL (fornecida pelo Railway) | ✅ Sim |
| `JWT_SECRET` | Segredo para assinar tokens JWT (64+ caracteres) | ✅ Sim |
| `JWT_EXPIRES_IN` | Tempo de expiração do token (ex: `7d`) | ✅ Sim |
| `REDIS_HOST` | Host do Redis (fornecido pelo Railway) | ✅ Sim |
| `REDIS_PORT` | Porta do Redis (fornecida pelo Railway) | ✅ Sim |
| `FRONTEND_URL` | URL pública do frontend (ex: `https://app.seu-projeto.railway.app`) | ✅ Sim |
| `NEXT_PUBLIC_API_URL` | URL pública da API (a mesma do backend) | ✅ Sim |
| `SUPER_ADMIN_EMAIL` | Email do super admin para seed inicial | ✅ Sim |
| `SUPER_ADMIN_PASSWORD` | Senha do super admin | ✅ Sim |

> ⚠️ **NUNCA** coloque essas variáveis no arquivo `.env` versionado no Git. Use apenas as **Railway Variables**.

### 5.3 Configuração da Porta Dinâmica

O Railway injeta a variável `PORT` automaticamente. O código deve respeitá-la:

```typescript
// main.ts — ✅ Já configurado
const port = process.env.PORT ?? 3001;
await app.listen(port, '0.0.0.0');
```

### 5.4 Configuração do Banco de Dados

O Railway fornece a `DATABASE_URL` automaticamente quando você adiciona o plugin PostgreSQL. O Prisma a utiliza:

```typescript
// prisma.service.ts
const connectionString = process.env.DATABASE_URL
  || process.env.POSTGRES_PRISMA_URL
  || process.env.POSTGRES_URL_NON_POOLING;
```

**Migrações:** O Dockerfile executa antes de iniciar:

```bash
# ✅ Correto — usa && para garantir ordem e logs visíveis
npx prisma migrate deploy   # Aplica migrações pendentes
node dist_seed/seed.js       # Popula dados iniciais (tolerante a falhas)
node dist/src/main.js        # Inicia o servidor
```

> ⚠️ **Importante:** O CMD do Dockerfile deve usar `&&` (não `;`) e **nunca** usar `2>/dev/null` para suprimir erros do Prisma. Caso contrário, migrações falham silenciosamente e o seed quebra em loop.

### 5.5 Configuração de Logs

O NestJS já possui Logger nativo. Para visualizar os logs no Railway:

1. Acesse o serviço do backend no Railway
2. Clique na aba **Deploy Logs**
3. Os logs do `console.log` e `this.logger.log` aparecerão aqui

### 5.6 Verificar se o Backend Está Funcionando

Após o deploy, acesse:

```
https://api.seu-projeto.railway.app/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "timestamp": "2026-07-11T12:00:00.000Z"
}
```

Se o healthcheck falhar, o Railway reinicia o serviço automaticamente.

---

## 6. Deploy do Frontend

### 6.1 Processo de Build

O Dockerfile do frontend faz um build multi-stage:

1. **deps**: Instala dependências com `npm ci`
2. **builder**: Copia node_modules, faz `npm run build` (Next.js gera `.next/`)
3. **runner**: Apenas copia `.next/standalone`, `.next/static` e `public/`

O build gera um servidor Node.js otimizado em `.next/standalone/server.js`.

### 6.2 Variáveis de Ambiente do Frontend

No serviço do frontend no Railway, adicione:

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `NEXT_PUBLIC_API_URL` | URL pública da API (ex: `https://api.seu-projeto.railway.app`) | ✅ Sim |

### 6.3 Configuração da URL da API

O frontend usa a variável `NEXT_PUBLIC_API_URL` para todas as requisições:

```typescript
// src/lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```

> 💡 Como tem o prefixo `NEXT_PUBLIC_`, essa variável é embedada no bundle JavaScript do lado do cliente durante o build. Por isso, se mudar a URL, precisa fazer um novo deploy.

### 6.4 Conectar Frontend e Backend

A conexão é feita via:

1. **Requisições HTTP** do frontend para o backend via `NEXT_PUBLIC_API_URL`
2. **Headers de autenticação**: token JWT no header `Authorization: Bearer <token>`
3. **Headers de tenant**: `x-hotel-id` e `x-branch-id` para isolamento multi-tenant

```typescript
// Exemplo de requisição do frontend
const response = await fetch(`${API_BASE_URL}/reservations`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'x-hotel-id': hotelId,
    'Content-Type': 'application/json',
  },
});
```

### 6.5 Configuração de Domínio

1. No serviço do frontend, vá em **Settings** → **Domains**
2. Gere um domínio `.railway.app` ou adicione um domínio personalizado
3. Para domínio personalizado, configure o DNS apontando para o IP fornecido pelo Railway

---

## 7. Banco de Dados

### 7.1 Adicionar PostgreSQL no Railway

1. No projeto Railway, clique em **New** → **Plugin**
2. Selecione **PostgreSQL**
3. O Railway cria automaticamente o banco e expõe a variável `DATABASE_URL`

> ⚠️ Aguarde alguns minutos até o plugin ficar verde (status "Running").

### 7.2 Adicionar Redis no Railway

1. No projeto Railway, clique em **New** → **Plugin**
2. Selecione **Redis**
3. O Railway expõe as variáveis `REDIS_HOST` e `REDIS_PORT`

### 7.3 Obter as Credenciais

1. Clique no plugin PostgreSQL
2. Vá na aba **Variables**
3. Copie o valor de `DATABASE_URL` (algo como `postgresql://user:pass@host:port/db?schema=public`)
4. Faça o mesmo para o Redis (`REDIS_HOST` e `REDIS_PORT`)

### 7.4 Configurar a DATABASE_URL

A `DATABASE_URL` deve ser configurada nas **Railway Variables** do serviço backend. O Railway já injeta automaticamente a variável do plugin no serviço — mas você pode precisar configurar manualmente se usar múltiplos ambientes.

No serviço do backend → **Variables**, verifique se `DATABASE_URL` já aparece. Se não, adicione manualmente com o valor do plugin.

### 7.5 Migrações de Banco

```bash
# O Dockerfile executa automaticamente:
npx prisma migrate deploy   # Aplica migrações pendentes

# Para criar uma nova migração (local):
cd backend
npx prisma migrate dev --name descricao_da_mudanca
git add prisma/migrations/
git commit -m "feat: nova migração - descricao"
git push
```

### 7.6 Boas Práticas de Segurança

- ✅ Use senhas fortes e únicas para o banco (o Railway gera automaticamente)
- ✅ Nunca compartilhe a `DATABASE_URL`
- ✅ Configure backups automáticos no Railway (plugin PostgreSQL → **Backups**)
- ✅ Use connection pooling quando necessário (Railway oferece `DATABASE_URL` com pool)
- ✅ Acessos de rede: por padrão, apenas serviços do mesmo projeto Railway podem se conectar

---

## 8. Comunicação Frontend/Backend

### 8.1 Configuração de CORS

O backend deve permitir requisições de origens diferentes (frontend). No `main.ts`:

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,           // Permite envio de cookies (token JWT)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-hotel-id', 'x-branch-id'],
});
```

> 💡 Em produção, `FRONTEND_URL` deve ser a URL exata do frontend (ex: `https://app.seu-projeto.railway.app`). Para múltiplas origens, use um array.

### 8.2 URLs de Produção

| Ambiente | Frontend | Backend |
|----------|----------|---------|
| **Local** | `http://localhost:3000` | `http://localhost:3001` |
| **Produção** | `https://app.seu-projeto.railway.app` | `https://api.seu-projeto.railway.app` |

### 8.3 Variável NEXT_PUBLIC_API_URL

No frontend, todas as requisições usam essa variável:

```typescript
// Desenvolvimento
NEXT_PUBLIC_API_URL=http://localhost:3001

// Produção
NEXT_PUBLIC_API_URL=https://api.seu-projeto.railway.app
```

### 8.4 Tratamento de Erros de Conexão

O arquivo `src/lib/api.ts` já implementa fallback e tratamento de erros:

```typescript
// O cliente API já trata:
// - Timeout de rede
// - Erros 401 (não autorizado) → redireciona para login
// - Erros 500 (servidor) → exibe toast de erro
// - Falha de conexão → mensagem amigável
```

---

## 9. Deploy Contínuo (CI/CD)

### 9.1 Como Funciona o Deploy Automático

Quando você conecta o Railway a um repositório GitHub, um **webhook** é criado automaticamente. A cada `git push` na branch configurada (geralmente `main`), o Railway:

1. **Detecta a mudança** via webhook do GitHub
2. **Clona o repositório** no estado do commit
3. **Executa o build** usando o Dockerfile ou os comandos configurados
4. **Sobe o novo container** com a imagem gerada
5. **Verifica o healthcheck** para garantir que o serviço está respondendo
6. **Redireciona o tráfego** para o novo container (zero-downtime)

### 9.2 O que Acontece Após um `git push`

```bash
git add .
git commit -m "fix: corrige validação de email no cadastro"
git push origin main
```

**Imediatamente após o push:**

1. ✅ GitHub recebe o commit
2. 🔄 Railway recebe o webhook (segundos)
3. 🏗️ Build começa (1-3 minutos)
4. ✅ Deploy concluído
5. 🌐 Aplicação atualizada

### 9.3 Acompanhar Builds

1. No Railway, acesse o serviço
2. Aba **Deploy Logs** → veja o log em tempo real do build
3. Aba **Deployments** → histórico de todos os deploys

### 9.4 Como Fazer Rollback

1. No serviço do Railway, vá em **Deployments**
2. Localize o deployment anterior que estava funcionando
3. Clique nos três pontos (⋮) → **Rollback to this deployment**
4. Confirme o rollback

> 💡 O rollback é instantâneo — o Railway mantém as imagens Docker dos últimos deployments.

---

## 10. Segurança em Produção

### 10.1 Nunca Subir Arquivos `.env` no GitHub

**Regra de ouro:** todo arquivo `.env` deve estar no `.gitignore`.

```gitignore
# .gitignore — já configurado
.env
.env.local
.env.prod
.env.development
.env.production.local
```

Se você acidentalmente commitou um `.env`:

```bash
# Remover do tracking (mas manter no disco)
git rm --cached .env backend/.env

# Adicionar ao .gitignore (se já não estiver)
echo ".env" >> .gitignore

# Commitar a correção
git commit -m "chore: remove .env do versionamento"
git push origin main
```

> ⚠️ **Importante:** se o `.env` já foi commitado, as credenciais estão no histórico do Git. **Altere todas as senhas expostas imediatamente.**

### 10.2 Uso Correto de Secrets

No Railway, as variáveis de ambiente são **criptografadas em repouso** e **não aparecem nos logs**. Para gerenciá-las:

1. Acesse o serviço → **Variables**
2. Adicione cada variável individualmente
3. Nunca use um arquivo `.env` para isso

### 10.3 Configuração de Variáveis no Railway

Para cada serviço, configure apenas as variáveis necessárias:

**Backend:**
```
DATABASE_URL=<fornecido pelo Railway PostgreSQL>
JWT_SECRET=<seu segredo de 64+ caracteres>
JWT_EXPIRES_IN=7d
REDIS_HOST=<fornecido pelo Railway Redis>
REDIS_PORT=6379
FRONTEND_URL=https://app.seu-projeto.railway.app
NEXT_PUBLIC_API_URL=https://api.seu-projeto.railway.app
SUPER_ADMIN_EMAIL=admin@seudominio.com
SUPER_ADMIN_PASSWORD=<senha forte>
```

**Frontend:**
```
NEXT_PUBLIC_API_URL=https://api.seu-projeto.railway.app
```

### 10.4 Proteção de Endpoints

- ✅ Rotas administrativas protegidas por JWT + guards de permissão
- ✅ Rotas públicas são apenas as necessárias (login, registro, booking engine)
- ✅ Super Admin tem rotas exclusivas para gestão de tenants
- ✅ Logs de auditoria registram todas as ações críticas

### 10.5 Logs e Monitoramento

- 📊 **Deploy Logs**: logs do build e início do servidor
- 📋 **Application Logs**: logs da aplicação em tempo real
- ❤️ **Healthcheck**: Railway monitora a cada 30s
- 🔄 **Auto-restart**: se o healthcheck falhar 3x, o Railway reinicia o serviço
- 📈 **Métricas**: CPU, memória, rede disponíveis na aba **Metrics**

---

## 11. Troubleshooting

### 11.1 Build Falhando

**Sintoma:** O deploy trava ou o log mostra erro de build.

**Causas comuns e soluções:**

| Problema | Solução |
|----------|---------|
| Erro de sintaxe no TypeScript | Verifique o código com `npm run build` localmente |
| Dependência ausente | Adicione ao `package.json` e commite novamente |
| Versão incompatível do Node | Verifique a imagem no Dockerfile (`node:22-alpine`) |
| Prisma Client não gerado | Verifique se `postinstall` está no `package.json` |

**Comando para testar localmente:**

```bash
cd backend && npm run build && cd ..
cd frontend && npm run build && cd ..
```

### 11.2 Railway Não Encontra `package.json`

**Sintoma:** `Error: Could not find package.json`

**Causa:** O **Root Directory** não está apontando para a pasta correta.

**Solução:** Verifique no serviço do Railway → **Settings** → **Root Directory**:

- Backend: `backend/`
- Frontend: `frontend/`

### 11.3 Erro de Porta

**Sintoma:** Healthcheck falha ou serviço não responde.

**Causa:** Porta fixa no código (hardcoded).

**Solução:** Use `process.env.PORT` com fallback:

```typescript
const port = process.env.PORT ?? 3001;
```

### 11.4 Erro de CORS

**Sintoma:** No navegador, requisições falham com erro CORS.

**Causa:** `FRONTEND_URL` não corresponde à URL real do frontend.

**Solução:**
1. Verifique a URL exata do frontend no Railway
2. Atualize `FRONTEND_URL` nas variáveis do backend
3. Faça um novo deploy

### 11.5 Frontend Não Consegue Acessar Backend

**Sintoma:** A página carrega mas dados não aparecem; erros de rede no console.

**Causas e soluções:**

| Problema | Solução |
|----------|---------|
| `NEXT_PUBLIC_API_URL` incorreta | Verifique a variável no frontend |
| Backend offline | Verifique o healthcheck do backend |
| CORS bloqueando | Verifique configuração de CORS no backend |
| Rede isolada | Serviços no mesmo projeto Railway se comunicam automaticamente |

### 11.6 Variáveis de Ambiente Não Carregadas

**Sintoma:** A aplicação usa valores `undefined` ou fallback.

**Causa:** Variáveis não configuradas no Railway.

**Solução:**
1. Acesse o serviço → **Variables**
2. Verifique se todas as variáveis obrigatórias estão presentes
3. Clique em **Deploy** para aplicar as mudanças

### 11.7 Banco de Dados Sem Conexão

**Sintoma:** Backend inicia mas erros de conexão com banco aparecem.

**Causas e soluções:**

| Problema | Solução |
|----------|---------|
| Plugin PostgreSQL não adicionado | Adicione o plugin no projeto Railway |
| `DATABASE_URL` incorreta | Verifique a URL fornecida pelo plugin |
| Migrações não executadas | Verifique se `prisma migrate deploy` roda no CMD do Dockerfile |
| Pool esgotado | Aumente o plano do banco ou configure pool size |

### 11.8 Seed Falha com "Table does not exist" (Loop de Reinicialização)

**Sintoma:** O log mostra:
```
5 migrations found in prisma/migrations
Applying migration `...` ✅
Iniciando seed idempotente...
PrismaClientKnownRequestError: The table "public.SystemPlan" does not exist
```
E o Railway reinicia o container em loop (3 tentativas).

**Causa raiz:** O `CMD` do Dockerfile estava usando `;` (ponto e vírgula) e `2>/dev/null`, fazendo com que:
1. O `prisma migrate deploy` falhasse silenciosamente (erro suprimido)
2. O `;` fizesse o seed executar mesmo após a falha
3. O seed quebrasse ao tentar acessar tabelas que não existiam
4. O `&&` impedisse o servidor de iniciar
5. O Railway reiniciasse o container → ciclo infinito

**Solução:**

```bash
# ✅ CMD correto no Dockerfile — use && (não ;) e nunca suprima erros
CMD ["sh", "-c", "npx prisma migrate deploy && node dist_seed/seed.js && node dist/src/main.js"]
```

**Medidas de proteção adicionais no seed:**
- O seed deve ter `try/catch` em cada bloco de operação
- Erros no seed não devem causar `process.exit(1)`
- O servidor deve iniciar mesmo se o seed falhar parcialmente

```typescript
// ✅ Seed resiliente — captura erros e continua
try {
  await prisma.systemPlan.upsert({ ... });
} catch (error) {
  console.warn('Planos não sincronizados (não fatal):', error.message);
  // O servidor continua funcionando sem os planos
}

// ❌ Nunca faça isso no catch do seed:
// process.exit(1);  ← Isso mata o container no Railway!
```

### 11.9 Container Reinicia em Loop (Healthcheck Falhando)

**Sintoma:** O Railway mostra "Restarting" repetidamente. O container inicia, falha o healthcheck, e é reiniciado.

**Causas comuns:**

| Problema | Solução |
|----------|---------|
| Porta errada | Verifique se `process.env.PORT` é usado no `main.ts` |
| Seed quebrou o servidor | Verifique se o seed não usa `process.exit(1)` |
| Migration falhou | Verifique os logs de migration no Dockerfile |
| Healthcheck muito rápido | Ajuste `healthcheckTimeout` no `railway.json` para 100+ segundos |

**Solução:** O Railway tem `restartPolicyMaxRetries: 3`. Após 3 falhas, ele para de tentar. Faça um novo deploy manual após corrigir o código.

---

## 12. Checklist Final de Publicação

### 📋 Lista de Verificação

```
[ ] 1. Código enviado ao GitHub
     - [ ] Todos os arquivos foram commitados
     - [ ] Nenhum .env está versionado
     - [ ] Último commit testado localmente

[ ] 2. Backend funcionando no Railway
     - [ ] Serviço criado com Root Directory = backend/
     - [ ] Dockerfile configurado corretamente
     - [ ] railway.json aponta para o Dockerfile
     - [ ] Build concluído sem erros
     - [ ] Healthcheck responde em /health

[ ] 3. Frontend funcionando no Railway
     - [ ] Serviço criado com Root Directory = frontend/
     - [ ] Dockerfile configurado corretamente
     - [ ] railway.json aponta para o Dockerfile
     - [ ] Build concluído sem erros
     - [ ] Página inicial carrega sem erros

[ ] 4. Banco conectado
     - [ ] Plugin PostgreSQL adicionado ao projeto
     - [ ] Plugin Redis adicionado ao projeto
     - [ ] DATABASE_URL configurada no backend
     - [ ] Migrações executadas com sucesso
     - [ ] Seed executado (super admin criado)

[ ] 5. Variáveis configuradas
     - [ ] Backend: JWT_SECRET, JWT_EXPIRES_IN, FRONTEND_URL
     - [ ] Backend: REDIS_HOST, REDIS_PORT
     - [ ] Backend: SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD
     - [ ] Frontend: NEXT_PUBLIC_API_URL

[ ] 6. Domínio configurado
     - [ ] Backend: domínio gerado ou personalizado
     - [ ] Frontend: domínio gerado ou personalizado
     - [ ] DNS configurado (se domínio personalizado)

[ ] 7. CORS validado
     - [ ] Backend permite requisições do frontend
     - [ ] Cookies e headers autorizados
     - [ ] Login funciona de ponta a ponta

[ ] 8. Deploy automático funcionando
     - [ ] Push para main dispara deploy no Railway
     - [ ] Build conclui automaticamente
     - [ ] Rollback testado
```

### 🚀 Após o Checklist

```bash
# Último push antes de celebrar 🎉
git add .
git commit -m "chore: preparação final para produção"
git push origin main

# Acompanhe o deploy no Railway
# Acesse: https://railway.app/project/{seu-projeto}
```

---

## Apêndices

### A. Comandos Úteis do Railway CLI

```bash
# Instalar CLI
npm install -g @railway/cli

# Login
railway login

# Linkar projeto
railway link

# Ver logs
railway logs

# Executar comando no ambiente
railway run npx prisma migrate deploy

# Abrir dashboard
railway open
```

### B. Geração de JWT_SECRET Seguro

```bash
# Linux / macOS
openssl rand -base64 64

# Windows (PowerShell)
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64))
```

### C. Exemplo de `.env.example` para o Projeto

```env
# ==============================================================
# TEMPLATE DE VARIÁVEIS DE AMBIENTE
# Copie para .env em desenvolvimento.
# Em produção, configure nas Railway Variables.
# ==============================================================

DATABASE_URL="postgresql://postgres:senha@localhost:5432/hotel_sistema?schema=public"
PORT=3001
JWT_SECRET=" Substitua_por_um_segredo_forte"
JWT_EXPIRES_IN="7d"
REDIS_HOST="localhost"
REDIS_PORT=6379
NEXT_PUBLIC_API_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"
SUPER_ADMIN_EMAIL="admin@exemplo.com"
SUPER_ADMIN_PASSWORD="SenhaForte123!"
```

---

> **Documentação gerada em:** 11 de julho de 2026
> **Última atualização:** Compatível com Railway CLI v3.x e GitHub
>
> _Este documento é parte da documentação oficial do projeto Hosped._
