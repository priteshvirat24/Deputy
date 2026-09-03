import { and, asc, desc, eq, gte } from 'drizzle-orm';
import { AuditEvent, AuditEventType, IAuditRepository } from '@deputy/domain';
import { DatabaseInstance } from '../client.js';
import { auditEvents } from '../schema/index.js';
import { AuditFilter, computeEventHash, GENESIS_HASH } from './audit-repository.js';

export class DrizzleAuditRepository implements IAuditRepository {
  constructor(private readonly db: DatabaseInstance) {}

  public async append(event: AuditEvent): Promise<void> {
    const latest = await this.getLatest();
    const previousEventHash = latest?.eventHash || GENESIS_HASH;
    const eventHash = computeEventHash(previousEventHash, event);

    await this.db.insert(auditEvents).values({
      id: event.eventId,
      timestamp: event.timestamp,
      eventType: event.eventType,
      actor: event.actor,
      sessionId: event.sessionId || null,
      requestId: event.requestId || null,
      toolId: event.toolId || null,
      toolVersion: event.toolVersion || null,
      status: event.status,
      reason: event.reason || null,
      provenance: event.provenance || null,
      metadata: event.metadata || {},
      previousEventHash,
      eventHash,
    });
  }

  public async list(filter?: AuditFilter): Promise<AuditEvent[]> {
    let query = this.db.select().from(auditEvents).orderBy(asc(auditEvents.timestamp)).$dynamic();

    const conditions = [];
    if (filter?.toolId) {
      conditions.push(eq(auditEvents.toolId, filter.toolId));
    }
    if (filter?.eventType) {
      conditions.push(eq(auditEvents.eventType, filter.eventType));
    }
    if (filter?.since) {
      conditions.push(gte(auditEvents.timestamp, filter.since));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    if (filter?.limit) {
      query = query.limit(filter.limit);
    }

    const rows = await query;
    return rows.map(r => this.mapRow(r));
  }

  public async getById(eventId: string): Promise<AuditEvent | undefined> {
    const rows = await this.db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.id, eventId))
      .limit(1);

    return rows[0] ? this.mapRow(rows[0]) : undefined;
  }

  public async getLatest(): Promise<AuditEvent | undefined> {
    const rows = await this.db
      .select()
      .from(auditEvents)
      .orderBy(desc(auditEvents.timestamp))
      .limit(1);

    return rows[0] ? this.mapRow(rows[0]) : undefined;
  }

  public async verifyIntegrity(): Promise<{
    valid: boolean;
    totalEvents: number;
    tamperedEventId?: string;
    reason?: string;
  }> {
    const allEvents = await this.db.select().from(auditEvents).orderBy(asc(auditEvents.timestamp));

    let expectedPrevious = GENESIS_HASH;

    for (let i = 0; i < allEvents.length; i++) {
      const row = allEvents[i]!;
      const evt = this.mapRow(row);

      if (evt.previousEventHash !== expectedPrevious) {
        return {
          valid: false,
          totalEvents: allEvents.length,
          tamperedEventId: evt.eventId,
          reason: `Broken chain link at index ${i}: expected previous hash '${expectedPrevious}', got '${evt.previousEventHash}'`,
        };
      }

      const recomputed = computeEventHash(evt.previousEventHash, evt);
      if (evt.eventHash !== recomputed) {
        return {
          valid: false,
          totalEvents: allEvents.length,
          tamperedEventId: evt.eventId,
          reason: `Tampered payload at index ${i}: stored hash '${evt.eventHash}' does not match recomputed hash '${recomputed}'`,
        };
      }

      expectedPrevious = evt.eventHash!;
    }

    return {
      valid: true,
      totalEvents: allEvents.length,
    };
  }

  private mapRow(row: typeof auditEvents.$inferSelect): AuditEvent {
    return {
      eventId: row.id,
      timestamp: row.timestamp,
      eventType: row.eventType as AuditEventType,
      actor: row.actor as any,
      sessionId: row.sessionId || undefined,
      requestId: row.requestId || undefined,
      toolId: row.toolId || undefined,
      toolVersion: row.toolVersion || undefined,
      status: row.status as any,
      reason: row.reason || undefined,
      provenance: (row.provenance as any) || undefined,
      metadata: (row.metadata as Record<string, unknown>) || {},
      previousEventHash: row.previousEventHash || undefined,
      eventHash: row.eventHash || undefined,
    };
  }
}
