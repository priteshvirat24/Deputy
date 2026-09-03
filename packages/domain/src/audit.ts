import { ProvenanceRecord } from './provenance.js';

export type AuditEventType =
  | 'DEMONSTRATION_STARTED'
  | 'ACTION_OBSERVED'
  | 'DEMONSTRATION_COMPLETED'
  | 'TOOL_CANDIDATE_CREATED'
  | 'TOOL_SCHEMA_GENERATED'
  | 'TOOL_VALIDATED'
  | 'TOOL_REGISTERED'
  | 'TOOL_UNREGISTERED'
  | 'TOOL_DISABLED'
  | 'TOOL_RETIRED'
  | 'TOOL_DELETED'
  | 'TOOL_INVOCATION_PROPOSED'
  | 'TOOL_INVOCATION_REFUSED'
  | 'POLICY_EVALUATED'
  | 'POLICY_ALLOWED'
  | 'POLICY_DENIED'
  | 'QUARANTINE_TRIGGERED'
  | 'QUARANTINE_VIOLATION'
  | 'RESPONSE_QUARANTINED'
  | 'ORIGIN_REJECTED'
  | 'AUTHORIZATION_REQUESTED'
  | 'AUTHORIZATION_GRANTED'
  | 'AUTHORIZATION_DENIED'
  | 'AUTHORIZATION_EXPIRED'
  | 'AUTHORIZATION_REVOKED'
  | 'AUTHORIZATION_CONSUMED'
  | 'CONCURRENT_CONSUMPTION_PREVENTED'
  | 'WEBAUTHN_REGISTERED'
  | 'WEBAUTHN_CREDENTIAL_REVOKED'
  | 'WEBAUTHN_CHALLENGE_CREATED'
  | 'WEBAUTHN_VERIFIED'
  | 'WEBAUTHN_REJECTED'
  | 'TOOL_EXECUTED'
  | 'TOOL_EXECUTION_FAILED'
  | 'TOOL_EXECUTION_ABORTED'
  | 'COMPENSATION_EXECUTED'
  | 'COMPENSATION_FAILED'
  | 'AUDIT_CHAIN_VERIFIED'
  | 'IDEMPOTENT_REPLAY_DETECTED';

export interface AuditActor {
  id: string;
  type: 'HUMAN' | 'USER' | 'AGENT' | 'SYSTEM';
  role?: string;
}

/**
 * Structured audit event.
 * Immutable and append-only from the application's perspective.
 * Cryptographically tamper-evident when hash chaining is active.
 * Never stores raw credentials, secrets, or unredacted tokens.
 */
export interface AuditEvent {
  eventId: string;
  timestamp: Date;
  eventType: AuditEventType;
  actor: AuditActor;
  sessionId?: string;
  requestId?: string;
  toolId?: string;
  toolVersion?: number;
  status: 'SUCCESS' | 'FAILURE' | 'INFO';
  reason?: string;
  provenance?: ProvenanceRecord;
  metadata?: Record<string, unknown>;
  /** Cryptographic hash of the immediately preceding event in the chain */
  previousEventHash?: string;
  /** SHA-256(previousEventHash + canonicalPayload) */
  eventHash?: string;
}

export interface IAuditRepository {
  append(event: AuditEvent): Promise<void>;
  list(filter?: {
    toolId?: string;
    eventType?: AuditEventType;
    actorId?: string;
    since?: Date;
    limit?: number;
  }): Promise<AuditEvent[]>;
  getById(eventId: string): Promise<AuditEvent | undefined>;
  getLatest(): Promise<AuditEvent | undefined>;
  verifyIntegrity?(): Promise<{
    valid: boolean;
    totalEvents: number;
    tamperedEventId?: string;
    reason?: string;
  }>;
}
