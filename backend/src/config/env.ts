import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.string().default('3000').transform(Number),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string(),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  MONGO_URI: z.string().default('mongodb://localhost:27017/nautiluz_crm'),
  MONGO_DB_NAME: z.string().default('nautiluz_crm'),
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.string().default('6379').transform(Number),
  STORAGE_PROVIDER: z.string().default('local'),
  UPLOAD_DIR: z.string().default('./uploads'),
  EXPORT_SIGNED_URL_TTL_SECONDS: z.string().default('3600').transform(Number)
});

export const env = envSchema.parse(process.env);
