import { z } from 'zod';
import { provenanceRecordSchema } from './provenance.schema.js';

export const auditEventTypeSchema = z.enum([
  'DEMONSTRATION_STARTED',
  'ACTION_OBSERVED',
  'DEMONSTRATION_COMPLETED',
  'TOOL_CANDIDATE_CREATED',
  'TOOL_SCHEMA_GENERATED',
  'TOOL_VALIDATED',
  'TOOL_REGISTERED',
  'TOOL_UNREGISTERED',
  'TOOL_DISABLED',
  'TOOL_RETIRED',
  'TOOL_DELETED',
  'TOOL_INVOCATION_PROPOSED',
  'TOOL_INVOCATION_REFUSED',
  'POLICY_EVALUATED',
  'POLICY_ALLOWED',
  'POLICY_DENIED',
  'QUARANTINE_TRIGGERED',
  'QUARANTINE_VIOLATION',
  'RESPONSE_QUARANTINED',
  'ORIGIN_REJECTED',
  'AUTHORIZATION_REQUESTED',
  'AUTHORIZATION_GRANTED',
  'AUTHORIZATION_DENIED',
  'AUTHORIZATION_EXPIRED',
  'AUTHORIZATION_REVOKED',
  'AUTHORIZATION_CONSUMED',
  'CONCURRENT_CONSUMPTION_PREVENTED',
  'WEBAUTHN_REGISTERED',
  'WEBAUTHN_CREDENTIAL_REVOKED',
  'WEBAUTHN_CHALLENGE_CREATED',
  'WEBAUTHN_VERIFIED',
  'WEBAUTHN_REJECTED',
  'TOOL_EXECUTED',
  'TOOL_EXECUTION_FAILED',
  'TOOL_EXECUTION_ABORTED',
  'COMPENSATION_EXECUTED',
  'COMPENSATION_FAILED',
  'AUDIT_CHAIN_VERIFIED',
  'IDEMPOTENT_REPLAY_DETECTED',
]);

export const auditActorSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['HUMAN', 'USER', 'AGENT', 'SYSTEM']),
  role: z.string().optional(),
});

export const auditEventSchema = z.object({
  eventId: z.string().min(1),
  timestamp: z.coerce.date(),
  eventType: auditEventTypeSchema,
  actor: auditActorSchema,
  sessionId: z.string().optional(),
  requestId: z.string().optional(),
  toolId: z.string().optional(),
  toolVersion: z.number().int().positive().optional(),
  status: z.enum(['SUCCESS', 'FAILURE', 'INFO']),
  reason: z.string().optional(),
  provenance: provenanceRecordSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
  previousEventHash: z.string().optional(),
  eventHash: z.string().optional(),
});

export type AuditEventSchemaType = z.infer<typeof auditEventSchema>;
