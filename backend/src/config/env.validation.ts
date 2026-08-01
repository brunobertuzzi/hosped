import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // --- Ambiente ---
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3001),

  // --- Banco de dados (OBRIGATÓRIO) ---
  DATABASE_URL: Joi.string().required(),

  // --- Cache / Filas (OPCIONAL) ---
  REDIS_URL: Joi.string().optional(),

  // --- Autenticação (OBRIGATÓRIO) ---
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),

  // --- Frontend (necessário para links de e-mail) ---
  FRONTEND_URL: Joi.string().optional(),

  // --- E-mail transacional (opcional - sem ele, links são logados no console) ---
  RESEND_API_KEY: Joi.string().optional(),
  EMAIL_FROM: Joi.string().optional(),

  // --- Pagamento SaaS (opcional - sem ele, faturas são geradas mas não cobradas automaticamente) ---
  SISTEMA_PAYMENT_TOKEN: Joi.string().optional(),
  MP_ACCESS_TOKEN: Joi.string().optional(),

  // --- Storage AWS S3 (opcional) ---
  AWS_S3_BUCKET: Joi.string().optional(),
  AWS_ACCESS_KEY_ID: Joi.string().optional(),
  AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
  AWS_REGION: Joi.string().optional(),

  // --- Super Admin seed (opcional) ---
  SUPER_ADMIN_EMAIL: Joi.string().email().optional(),
  SUPER_ADMIN_PASSWORD: Joi.string().optional(),

  // --- Google Places (opcional) ---
  GOOGLE_PLACES_API_KEY: Joi.string().optional(),

  // Permite outras variáveis de ambiente sem rejeitar
}).unknown(true);
