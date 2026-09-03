import { Authorization, ToolProposal } from '@deputy/domain';
import { authorizationSchema } from '@deputy/schemas';
import { computeArgumentDigest } from './argument-digest.js';
import { NonceManager } from './nonce-manager.js';

export interface VerificationResult {
  valid: boolean;
  reason?: string;
}

export class AuthorizationVerifier {
  constructor(private nonceManager: NonceManager = new NonceManager()) {}

  /**
   * Cryptographically verify that an authorization matches the exact tool proposal.
   * Enforces:
   * - Invariant 4: Authorization bound to exact invocation
   * - Invariant 5: Changing meaningful arguments invalidates authorization
   */
  public verify(
    authorization: Authorization,
    proposal: ToolProposal,
    consumeNonce = false,
  ): VerificationResult {
    // 1. Validate schema integrity
    const schemaValidation = authorizationSchema.safeParse(authorization);
    if (!schemaValidation.success) {
      return {
        valid: false,
        reason: `Authorization object failed schema validation: ${schemaValidation.error.message}`,
      };
    }

    // 2. Check authorization status
    if (authorization.status !== 'AUTHORIZED') {
      return {
        valid: false,
        reason: `Authorization status is '${authorization.status}', expected 'AUTHORIZED'`,
      };
    }

    // 3. Check tool identity match
    if (authorization.toolId !== proposal.toolId) {
      return {
        valid: false,
        reason: `Tool mismatch: authorization for '${authorization.toolId}', proposed '${proposal.toolId}'`,
      };
    }

    // 4. Check tool version match
    if (authorization.toolVersion !== proposal.toolVersion) {
      return {
        valid: false,
        reason: `Tool version mismatch: authorization for v${authorization.toolVersion}, proposed v${proposal.toolVersion}`,
      };
    }

    // 5. Invariant 5 check: Compute SHA-256 digest of proposal arguments and match with authorization digest
    const expectedDigest = computeArgumentDigest(proposal.arguments);
    if (authorization.argumentDigest !== expectedDigest) {
      return {
        valid: false,
        reason: `Argument digest mismatch (arguments were altered): expected '${expectedDigest}', got '${authorization.argumentDigest}'`,
      };
    }

    // 6. Check temporal validity (expiration)
    const now = new Date();
    if (now > new Date(authorization.expiresAt)) {
      return {
        valid: false,
        reason: `Authorization expired at ${authorization.expiresAt.toISOString()}`,
      };
    }

    // 7. Check revocation
    if (authorization.revokedAt) {
      return {
        valid: false,
        reason: `Authorization was revoked: ${authorization.revocationReason || 'No reason provided'}`,
      };
    }

    // 8. Replay prevention: check nonce if consumption requested
    if (consumeNonce) {
      const unused = this.nonceManager.consumeNonce(authorization.nonce);
      if (!unused) {
        return {
          valid: false,
          reason: 'Authorization nonce has already been consumed (replay attack detected)',
        };
      }
    }

    return { valid: true };
  }
}
