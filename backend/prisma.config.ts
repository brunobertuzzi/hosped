import "dotenv/config";
import { defineConfig } from "prisma/config";

// Railway expõe várias variáveis de conexão. A ordem de precedência:
// 1. DATABASE_URL (conexão direta, fornecida pelo Railway PostgreSQL plugin)
// 2. POSTGRES_PRISMA_URL (conexão direta, alternativa Railway)
// 3. POSTGRES_URL_NON_POOLING (conexão direta sem pool, Railway)
// 4. POSTGRES_URL (pooled, Railway)
//
// Durante o BUILD do Docker as variáveis Railway não estão disponíveis,
// mas o prisma generate só precisa do schema, não de conexão real.
// O fallback é usado apenas para permitir o build; em runtime a URL real
// será injetada pelo Railway.
const databaseUrl =
  process.env["DATABASE_URL"] ||
  process.env["POSTGRES_PRISMA_URL"] ||
  process.env["POSTGRES_URL_NON_POOLING"] ||
  process.env["POSTGRES_URL"] ||
  "postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
