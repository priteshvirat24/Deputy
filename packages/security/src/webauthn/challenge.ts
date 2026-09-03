import { createHash, randomBytes } from 'node:crypto';

export interface BoundChallengeParams {
  toolId: string;
  toolVersion: number;
  argumentDigest: string;
  requestId: string;
  nonce: string;
  version?: string;
}

/**
 * Computes a deterministic WebAuthn challenge cryptographically bound
 * to the exact tool invocation and exact arguments.
 *
 * Any variation in toolId, version, arguments (reflected in argumentDigest),
 * requestId, or nonce produces a completely different challenge, rendering
 * any authenticator signature mathematically invalid for any other invocation.
 */
export function computeBoundChallenge(params: BoundChallengeParams): string {
  const versionPrefix = params.version || 'deputy-auth-v1';
  const canonicalString = [
    versionPrefix,
    params.toolId,
    String(params.toolVersion),
    params.argumentDigest,
    params.requestId,
    params.nonce,
  ].join(':');

  return createHash('sha256').update(canonicalString, 'utf8').digest('base64url');
}

/**
 * Generate a random cryptographic challenge for authenticator registration.
 */
export function generateRegistrationChallenge(): string {
  return randomBytes(32).toString('base64url');
}
