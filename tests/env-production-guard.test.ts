import { describe, expect, it } from 'vitest';
import { envSchema } from '@deputy/config';

/**
 * The production env guard exists so a single-origin deploy fails loudly at
 * startup rather than silently at the passkey ceremony. WebAuthn requires the
 * RP ID to match the serving origin and a secure (https) context; a localhost
 * RP_ID or an http origin passes locally and then breaks the WITNESS half of
 * the demo on the deployed build.
 */

const PROD_BASE = {
  NODE_ENV: 'production',
  SERVE_STATIC: 'true',
  RP_ID: 'deputy.example.com',
  ORIGIN: 'https://deputy.example.com',
  WEBAUTHN_ORIGIN: 'https://deputy.example.com',
  ALLOWED_ORIGINS: 'https://deputy.example.com',
  REPOSITORY_MODE: 'MEMORY',
  ALLOW_IN_MEMORY_DEV: 'true',
  SESSION_SECRET: 'a_real_production_secret_at_least_32_chars',
} as const;

function issuePaths(result: ReturnType<typeof envSchema.safeParse>): string[] {
  if (result.success) return [];
  return result.error.issues.map(i => i.path.join('.'));
}

describe('production env guard — WebAuthn origin agreement', () => {
  it('accepts a well-formed https single-origin production config', () => {
    const result = envSchema.safeParse(PROD_BASE);
    expect(result.success).toBe(true);
  });

  it('rejects a localhost RP_ID in production', () => {
    const result = envSchema.safeParse({ ...PROD_BASE, RP_ID: 'localhost' });
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain('RP_ID');
  });

  it('rejects a 127.0.0.1 RP_ID in production', () => {
    const result = envSchema.safeParse({ ...PROD_BASE, RP_ID: '127.0.0.1' });
    expect(issuePaths(result)).toContain('RP_ID');
  });

  it('rejects a non-HTTPS WEBAUTHN_ORIGIN in production', () => {
    const result = envSchema.safeParse({
      ...PROD_BASE,
      WEBAUTHN_ORIGIN: 'http://deputy.example.com',
    });
    expect(issuePaths(result)).toContain('WEBAUTHN_ORIGIN');
  });

  it('rejects a non-HTTPS ORIGIN in production', () => {
    const result = envSchema.safeParse({ ...PROD_BASE, ORIGIN: 'http://deputy.example.com' });
    expect(issuePaths(result)).toContain('ORIGIN');
  });

  it('does NOT apply the guard in development (localhost is fine locally)', () => {
    const result = envSchema.safeParse({
      NODE_ENV: 'development',
      RP_ID: 'localhost',
      ORIGIN: 'http://localhost:5173',
      WEBAUTHN_ORIGIN: 'http://localhost:5173',
    });
    expect(result.success).toBe(true);
  });

  it('parses SERVE_STATIC as a boolean', () => {
    const on = envSchema.safeParse({ ...PROD_BASE, SERVE_STATIC: 'true' });
    const off = envSchema.safeParse({ ...PROD_BASE, SERVE_STATIC: 'false' });
    expect(on.success && on.data.SERVE_STATIC).toBe(true);
    expect(off.success && off.data.SERVE_STATIC).toBe(false);
  });
});
