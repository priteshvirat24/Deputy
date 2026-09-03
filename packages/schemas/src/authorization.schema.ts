import { z } from 'zod';

export const authorizationStatusSchema = z.enum([
  'PENDING',
  'AUTHORIZED',
  'CONSUMED',
  'REJECTED',
  'EXPIRED',
  'REVOKED',
]);

export const authorizationMethodSchema = z.enum(['HUMAN_EXPLICIT', 'WEBAUTHN_UV']);

export const authorizingActorSchema = z.object({
  id: z.string().min(1, 'Authorizing actor ID is required'),
  email: z.string().email().optional(),
  role: z.string().min(1, 'Authorizing actor role is required'),
});

export const webauthnAssertionDataSchema = z.object({
  credentialId: z.string().min(1),
  clientDataJSON: z.string().min(1),
  authenticatorData: z.string().min(1),
  signature: z.string().min(1),
  userHandle: z.string().optional(),
  userVerified: z.boolean(),
});

export const webauthnCredentialSchema = z.object({
  id: z.string().min(1),
  actorId: z.string().min(1),
  credentialId: z.string().min(1),
  publicKey: z.string().min(1),
  counter: z.number().int().nonnegative(),
  transports: z.array(z.string()).optional(),
  aaguid: z.string().optional(),
  createdAt: z.coerce.date(),
  lastUsedAt: z.coerce.date().optional(),
  revokedAt: z.coerce.date().optional(),
});

export const authorizationSchema = z.object({
  authorizationId: z.string().min(1, 'Authorization ID is required'),
  requestId: z.string().min(1, 'Request ID is required'),
  toolId: z.string().min(1, 'Target tool ID is required'),
  toolVersion: z.number().int().positive(),
  argumentDigest: z
    .string()
    .regex(/^[a-f0-9]{64}$/i, 'Argument digest must be a 64-character SHA-256 hex string'),
  authorizationMethod: authorizationMethodSchema,
  actor: authorizingActorSchema,
  issuedAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
  nonce: z.string().min(16, 'Cryptographic nonce must be at least 16 characters'),
  status: authorizationStatusSchema,
  webauthnAssertion: webauthnAssertionDataSchema.optional(),
  credentialReference: z.string().optional(),
  consumedAt: z.coerce.date().optional(),
  consumedByProposalId: z.string().optional(),
  revokedAt: z.coerce.date().optional(),
  revocationReason: z.string().optional(),
});

export type AuthorizationSchemaType = z.infer<typeof authorizationSchema>;
export type WebAuthnCredentialSchemaType = z.infer<typeof webauthnCredentialSchema>;
