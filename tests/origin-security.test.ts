import { describe, expect, it } from 'vitest';
import { OriginValidator } from '@deputy/security';

describe('Strict WHATWG Origin Security & Prefix Attack Defenses', () => {
  const allowedOrigins = ['http://localhost:5173', 'https://admin.deputy.internal'];

  it('allows exact origin matches', () => {
    const check1 = OriginValidator.validate('http://localhost:5173', allowedOrigins);
    expect(check1.allowed).toBe(true);

    const check2 = OriginValidator.validate('https://admin.deputy.internal', allowedOrigins);
    expect(check2.allowed).toBe(true);
  });

  it('rejects origin prefix attacks (attacker subdomain spoof)', () => {
    // Attackers append domain suffixes: e.g. admin.deputy.internal.attacker.com
    const prefixAttack1 = 'https://admin.deputy.internal.attacker.com';
    const check1 = OriginValidator.validate(prefixAttack1, allowedOrigins);
    expect(check1.allowed).toBe(false);
    expect(check1.refusalCode).toBe('ORIGIN_NOT_PERMITTED');

    const prefixAttack2 = 'http://localhost:5173.malicious.io';
    const check2 = OriginValidator.validate(prefixAttack2, allowedOrigins);
    expect(check2.allowed).toBe(false);
  });

  it('enforces protocol separation (HTTP vs HTTPS)', () => {
    const httpSpoof = 'http://admin.deputy.internal'; // should be https
    const check = OriginValidator.validate(httpSpoof, allowedOrigins);
    expect(check.allowed).toBe(false);
  });

  it('enforces port separation', () => {
    const differentPort = 'http://localhost:5174';
    const check = OriginValidator.validate(differentPort, allowedOrigins);
    expect(check.allowed).toBe(false);
  });

  it('normalizes trailing slashes and paths to pure origin', () => {
    // WHATWG Origin of 'https://admin.deputy.internal/some/path?query=1' is 'https://admin.deputy.internal'
    const withPath = 'https://admin.deputy.internal/some/path?query=1';
    const check = OriginValidator.validate(withPath, allowedOrigins);
    expect(check.allowed).toBe(true);
  });

  it('rejects malformed or invalid origin strings fail-closed', () => {
    expect(OriginValidator.validate('not_a_valid_url', allowedOrigins).allowed).toBe(false);
    expect(OriginValidator.validate('javascript:alert(1)', allowedOrigins).allowed).toBe(false);
    expect(OriginValidator.validate('', allowedOrigins).allowed).toBe(false);
  });

  it('enforces deny-by-default when allowedOrigins list is empty or restricted', () => {
    const check = OriginValidator.validate('http://localhost:5173', []);
    expect(check.allowed).toBe(false);
  });
});
