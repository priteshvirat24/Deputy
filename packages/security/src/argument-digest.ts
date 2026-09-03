import { createHash } from 'node:crypto';

/**
 * Deterministically serialize a JavaScript value to canonical JSON.
 * Recursively sorts keys of objects to ensure identical arguments yield identical digests.
 * Normalizes all Unicode strings using NFC standard.
 */
export function canonicalizeJson(val: unknown): string {
  if (val === null || val === undefined) {
    return 'null';
  }

  if (typeof val === 'string') {
    return JSON.stringify(val.normalize('NFC'));
  }

  if (typeof val !== 'object') {
    return JSON.stringify(val);
  }

  if (Array.isArray(val)) {
    const items = val.map(item => canonicalizeJson(item));
    return `[${items.join(',')}]`;
  }

  const obj = val as Record<string, unknown>;
  const sortedKeys = Object.keys(obj)
    .map(k => k.normalize('NFC'))
    .sort();

  const pairs = sortedKeys.map(key => {
    return `${JSON.stringify(key)}:${canonicalizeJson(obj[key])}`;
  });

  return `{${pairs.join(',')}}`;
}

/**
 * Compute the canonical SHA-256 hex digest of tool arguments.
 * This digest is cryptographically bound into human authorizations.
 */
export function computeArgumentDigest(args: Record<string, unknown>): string {
  const canonicalString = canonicalizeJson(args);
  return createHash('sha256').update(canonicalString, 'utf8').digest('hex');
}
