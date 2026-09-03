export type AuthorizationStatus =
  'PENDING' | 'AUTHORIZED' | 'CONSUMED' | 'REJECTED' | 'EXPIRED' | 'REVOKED';

export type AuthorizationMethod = 'HUMAN_EXPLICIT' | 'WEBAUTHN_UV';

export interface AuthorizingActor {
  id: string;
  email?: string;
  role: string;
}

export interface WebAuthnAssertionData {
  credentialId: string;
  clientDataJSON: string;
  authenticatorData: string;
  signature: string;
  userHandle?: string;
  userVerified: boolean;
}

export interface WebAuthnCredential {
  id: string;
  actorId: string;
  credentialId: string;
  publicKey: string;
  counter: number;
  transports?: string[];
  aaguid?: string;
  createdAt: Date;
  lastUsedAt?: Date;
  revokedAt?: Date;
}

/**
 * Domain model representing explicit human authorization.
 * Cryptographically bound to the exact tool invocation and exact arguments.
 */
export interface Authorization {
  /** Unique authorization identifier */
  authorizationId: string;
  /** Request correlation ID */
  requestId: string;
  /** Target tool ID */
  toolId: string;
  /** Target tool version */
  toolVersion: number;
  /**
   * SHA-256 hex digest of the canonicalized argument payload.
   * Any change in arguments produces a different digest and invalidates authorization.
   */
  argumentDigest: string;
  /** Authorization method used */
  authorizationMethod: AuthorizationMethod;
  /** Human actor granting authorization */
  actor: AuthorizingActor;
  /** Issuance timestamp */
  issuedAt: Date;
  /** Expiration timestamp */
  expiresAt: Date;
  /** Cryptographic one-time nonce to prevent replay attacks */
  nonce: string;
  /** Current lifecycle status of this authorization */
  status: AuthorizationStatus;
  /** WebAuthn assertion payload if authorized via hardware passkey */
  webauthnAssertion?: WebAuthnAssertionData;
  /** Reference to signing credential */
  credentialReference?: string;
  /** Single-use consumption timestamp */
  consumedAt?: Date;
  /** Proposal ID that consumed this authorization */
  consumedByProposalId?: string;
  /** Revocation timestamp if revoked */
  revokedAt?: Date;
  /** Revocation reason */
  revocationReason?: string;
}
