import { createHash } from 'node:crypto';
import { AuditEvent, AuditEventType, IAuditRepository } from '@deputy/domain';

export interface AuditFilter {
  toolId?: string;
  eventType?: AuditEventType;
  actorId?: string;
  since?: Date;
  limit?: number;
}

export const GENESIS_HASH = '0'.repeat(64);

export function computeEventHash(previousHash: string, event: AuditEvent): string {
  const payload = {
    eventId: event.eventId,
    timestamp: new Date(event.timestamp).toISOString(),
    eventType: event.eventType,
    actor: event.actor,
    sessionId: event.sessionId || null,
    requestId: event.requestId || null,
    toolId: event.toolId || null,
    toolVersion: event.toolVersion || null,
    status: event.status,
    reason: event.reason || null,
    metadata: event.metadata || {},
  };
  const canonical = JSON.stringify(payload, Object.keys(payload).sort());
  return createHash('sha256').update(`${previousHash}:${canonical}`).digest('hex');
}

export class InMemoryAuditRepository implements IAuditRepository {
  private events: AuditEvent[] = [];

  /**
   * Append an event. Strictly append-only with cryptographic hash chaining.
   */
  public async append(event: AuditEvent): Promise<void> {
    const cloned: AuditEvent = JSON.parse(JSON.stringify(event));
    cloned.timestamp = new Date(event.timestamp);

    // Cryptographic hash chaining
    const latest = this.events[this.events.length - 1];
    cloned.previousEventHash = latest?.eventHash || GENESIS_HASH;
    cloned.eventHash = computeEventHash(cloned.previousEventHash, cloned);

    this.events.push(cloned);
  }

  public async list(filter?: AuditFilter): Promise<AuditEvent[]> {
    let result = [...this.events];

    if (filter?.toolId) {
      result = result.filter(e => e.toolId === filter.toolId);
    }
    if (filter?.eventType) {
      result = result.filter(e => e.eventType === filter.eventType);
    }
    if (filter?.actorId) {
      result = result.filter(e => e.actor.id === filter.actorId);
    }
    if (filter?.since) {
      result = result.filter(e => new Date(e.timestamp) >= filter.since!);
    }

    if (filter?.limit) {
      result = result.slice(-filter.limit);
    }

    return result.map(e => ({
      ...e,
      timestamp: new Date(e.timestamp),
      provenance: e.provenance
        ? { ...e.provenance, retrievedAt: new Date(e.provenance.retrievedAt) }
        : undefined,
    }));
  }

  public async getById(eventId: string): Promise<AuditEvent | undefined> {
    const event = this.events.find(e => e.eventId === eventId);
    if (!event) return undefined;
    return {
      ...event,
      timestamp: new Date(event.timestamp),
      provenance: event.provenance
        ? { ...event.provenance, retrievedAt: new Date(event.provenance.retrievedAt) }
        : undefined,
    };
  }

  public async getLatest(): Promise<AuditEvent | undefined> {
    const event = this.events[this.events.length - 1];
    if (!event) return undefined;
    return {
      ...event,
      timestamp: new Date(event.timestamp),
    };
  }

  /**
   * Scans all events in historical sequence, verifying that every previousEventHash
   * matches the prior event's hash, and recomputes eventHash to detect tampering.
   */
  public async verifyIntegrity(): Promise<{
    valid: boolean;
    totalEvents: number;
    tamperedEventId?: string;
    reason?: string;
  }> {
    let expectedPrevious = GENESIS_HASH;

    for (let i = 0; i < this.events.length; i++) {
      const evt = this.events[i]!;

      if (evt.previousEventHash !== expectedPrevious) {
        return {
          valid: false,
          totalEvents: this.events.length,
          tamperedEventId: evt.eventId,
          reason: `Broken chain link at index ${i}: expected previous hash '${expectedPrevious}', got '${evt.previousEventHash}'`,
        };
      }

      const recomputed = computeEventHash(evt.previousEventHash, evt);
      if (evt.eventHash !== recomputed) {
        return {
          valid: false,
          totalEvents: this.events.length,
          tamperedEventId: evt.eventId,
          reason: `Tampered payload at index ${i}: stored hash '${evt.eventHash}' does not match recomputed hash '${recomputed}'`,
        };
      }

      expectedPrevious = evt.eventHash;
    }

    return {
      valid: true,
      totalEvents: this.events.length,
    };
  }
}
