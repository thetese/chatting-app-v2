import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3002),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  COOKIE_DOMAIN: z.string().optional(),
  REDIS_URL: z.string().optional(),
  OBJECT_STORAGE_BASE_URL: z.string().url().default('https://storage.local'),
  STORAGE_SIGNING_SECRET: z.string().min(32),
  MALWARE_SCAN_SECRET: z.string().min(16)
});

export const env = envSchema.parse(process.env);
