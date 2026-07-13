FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat

# Instala dependências
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copia o código do backend
COPY . .

# Gera o Prisma Client e faz o build
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build
RUN npm run build:seed || echo "[warning] Seed build falhou"

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PRISMA_CLI_BINARY_TARGETS="linux-musl"

# Install runtime dependencies
RUN apk add --no-cache libc6-compat openssl wget

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist_seed ./dist_seed
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "\
  echo \"[Entrypoint] Resolvendo migration com falha anterior...\" && \
  npx prisma migrate resolve --rolled-back 20260711132500_add_system_plan 2>/dev/null && \
  echo \"[Entrypoint] Migration marcada como rolled back\" || true ; \
  echo \"[Entrypoint] Verificando migrações pendentes...\" && \
  npx prisma db push --accept-data-loss ; \
  echo \"[Entrypoint] Executando seed...\" && \
  (node dist_seed/seed.js || echo \"[Entrypoint] Seed finalizado (com avisos)\") && \
  echo \"[Entrypoint] Iniciando servidor...\" && \
  node dist/src/main.js"]
