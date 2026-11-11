import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/opportunityloop'),
  USE_IN_MEMORY_DB: z
    .string()
    .optional()
    .default('false')
    .transform((v) => v === 'true'),
  SESSION_SECRET: z
    .string()
    .min(16)
    .default('dev-only-session-secret-change-in-production-please'),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(7),
  COOKIE_DOMAIN: z.string().optional().default(''),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
  API_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  REMINDER_INTERVAL_MINUTES: z.coerce.number().int().positive().default(60),
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .string()
    .optional()
    .default('false')
    .transform((v) => v === 'true'),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM: z.string().optional().default('OpportunityLoop <no-reply@example.com>')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

if (
  parsed.data.NODE_ENV === 'production' &&
  parsed.data.SESSION_SECRET.startsWith('dev-only-')
) {
  console.error('SESSION_SECRET must be explicitly configured in production.');
  process.exit(1);
}

if (parsed.data.NODE_ENV === 'production' && parsed.data.USE_IN_MEMORY_DB) {
  console.error('USE_IN_MEMORY_DB cannot be enabled in production.');
  process.exit(1);
}

export const env = parsed.data;

