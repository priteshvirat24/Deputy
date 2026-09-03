import { describe, expect, it } from 'vitest';
import { canonicalizeJson, computeArgumentDigest } from '@deputy/security';

describe('Canonicalization Security & Invariant Audit', () => {
  it('produces identical digest for keys inserted in different order', () => {
    const objA = { z: 1, a: 2, m: { nestedB: 'hello', nestedA: 'world' } };
    const objB = { a: 2, m: { nestedA: 'world', nestedB: 'hello' }, z: 1 };

    const digestA = computeArgumentDigest(objA);
    const digestB = computeArgumentDigest(objB);

    expect(digestA).toBe(digestB);
  });

  it('produces identical digest across deep nested structures regardless of key order', () => {
    const deepA = {
      level1: {
        level2: {
          level3: {
            zebra: [1, 2, 3],
            alpha: { y: true, x: false },
          },
        },
      },
    };
    const deepB = {
      level1: {
        level2: {
          level3: {
            alpha: { x: false, y: true },
            zebra: [1, 2, 3],
          },
        },
      },
    };

    expect(computeArgumentDigest(deepA)).toBe(computeArgumentDigest(deepB));
  });

  it('preserves array order strictly while sorting object keys within array elements', () => {
    const arrA = [
      { b: 2, a: 1 },
      { y: 2, x: 1 },
    ];
    const arrB = [
      { a: 1, b: 2 },
      { x: 1, y: 2 },
    ];
    const arrC = [
      { x: 1, y: 2 },
      { a: 1, b: 2 },
    ]; // order flipped

    expect(computeArgumentDigest({ items: arrA })).toBe(computeArgumentDigest({ items: arrB }));
    expect(computeArgumentDigest({ items: arrA })).not.toBe(computeArgumentDigest({ items: arrC }));
  });

  it('normalizes Unicode strings using NFC form', () => {
    // "é" can be single code point (NFC) or 'e' + combining accent (NFD)
    const nfc = 'caf\u00E9';
    const nfd = 'cafe\u0301';

    expect(nfc).not.toBe(nfd); // Different code points
    expect(computeArgumentDigest({ store: nfc })).toBe(computeArgumentDigest({ store: nfd }));
  });

  it('handles numeric representations consistently', () => {
    const d1 = computeArgumentDigest({ val: 42 });
    const d2 = computeArgumentDigest({ val: 42.0 });
    expect(d1).toBe(d2);
  });

  it('resists prototype pollution payloads safely without throwing or polluting prototype', () => {
    const maliciousPayload = JSON.parse('{"__proto__":{"polluted":"yes"},"val":123}');
    const digest = computeArgumentDigest(maliciousPayload);

    expect(digest).toBeDefined();
    expect(typeof digest).toBe('string');
    expect(digest.length).toBe(64); // SHA-256 hex
    expect((Object.prototype as any).polluted).toBeUndefined();
  });

  it('handles null, empty objects, and empty arrays safely', () => {
    expect(computeArgumentDigest({})).toBeDefined();
    expect(computeArgumentDigest({ emptyArr: [], emptyObj: {}, nullVal: null })).toBeDefined();
    expect(canonicalizeJson({})).toBe('{}');
    expect(canonicalizeJson([])).toBe('[]');
    expect(canonicalizeJson(null)).toBe('null');
  });

  it('produces expected SHA-256 format', () => {
    const digest = computeArgumentDigest({ customerId: 'cust_123', amount: 1000 });
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
  });
});
