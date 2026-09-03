import { z } from 'zod';
import dotenv from 'dotenv';

// Load local environment variables if available
dotenv.config();

export const DEV_DEFAULT_SECRET = 'dev_super_secret_session_key_minimum_32_characters_long';

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    HOST: z.string().default('127.0.0.1'),
    ORIGIN: z.string().url().default('http://localhost:5173'),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    DATABASE_URL: z
      .string()
      .url()
      .default('postgres://postgres:postgres@localhost:5432/deputy_dev'),
    REPOSITORY_MODE: z.enum(['MEMORY', 'POSTGRES']).default('MEMORY'),
    ALLOW_IN_MEMORY_DEV: z
      .string()
      .transform(val => val === 'true')
      .or(z.boolean())
      .default(false),
    RP_ID: z.string().default('localhost'),
    RP_NAME: z.string().default('DEPUTY Security Authority'),
    WEBAUTHN_ORIGIN: z.string().url().default('http://localhost:5173'),
    ALLOWED_ORIGINS: z
      .string()
      .default('http://localhost:5173,http://127.0.0.1:5173')
      .transform(val => val.split(',').map(s => s.trim())),
    SESSION_SECRET: z.string().min(32).default(DEV_DEFAULT_SECRET),
    RATE_LIMIT_BACKEND: z.enum(['memory', 'redis']).default('memory'),
    REDIS_URL: z.string().url().optional(),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
    WEBMCP_DEBUG: z
      .string()
      .transform(val => val === 'true')
      .or(z.boolean())
      .default(false),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      // 1. Session secret must not be the dev default
      if (data.SESSION_SECRET === DEV_DEFAULT_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['SESSION_SECRET'],
          message: 'In production, SESSION_SECRET cannot use the development default string.',
        });
      }

      // 2. Reject MEMORY repository mode in production unless explicit override is given
      if (data.REPOSITORY_MODE === 'MEMORY' && !data.ALLOW_IN_MEMORY_DEV) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['REPOSITORY_MODE'],
          message:
            'In production, REPOSITORY_MODE cannot be MEMORY without explicit ALLOW_IN_MEMORY_DEV=true.',
        });
      }

      // 3. Rate limit backend must be redis if configured for high availability
      if (data.RATE_LIMIT_BACKEND === 'redis' && !data.REDIS_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['REDIS_URL'],
          message: 'REDIS_URL is required when RATE_LIMIT_BACKEND is set to redis.',
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

let parsedEnv: Env | null = null;

export function getEnv(): Env {
  if (!parsedEnv) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      const issues = result.error.issues
        .map(issue => `  - ${issue.path.join('.')}: ${issue.message}`)
        .join('\n');
      throw new Error(`Environment validation failed:\n${issues}`);
    }
    parsedEnv = result.data;
  }
  return parsedEnv;
}

export function resetEnvForTesting(): void {
  parsedEnv = null;
}
