import { and, asc, eq } from 'drizzle-orm';
import { Demonstration, DemonstrationStatus, SemanticAction } from '@deputy/domain';
import { DatabaseInstance } from '../client.js';
import { demonstrationActions, demonstrations } from '../schema/index.js';
import { DemonstrationFilter, IDemonstrationRepository } from './demonstration-repository.js';

export class DrizzleDemonstrationRepository implements IDemonstrationRepository {
  constructor(private readonly db: DatabaseInstance) {}

  public async create(demo: Demonstration): Promise<Demonstration> {
    const existing = await this.getById(demo.demonstrationId);
    if (existing) {
      throw new Error(`Demonstration '${demo.demonstrationId}' already exists.`);
    }

    await this.db.insert(demonstrations).values({
      id: demo.demonstrationId,
      sessionId: demo.sessionId,
      actorId: demo.actorId,
      startedAt: demo.startedAt,
      completedAt: demo.completedAt || null,
      status: demo.status,
      applicationContext: demo.applicationContext,
      metadata: demo.metadata || {},
      createdAt: demo.startedAt,
    });

    if (demo.actions && demo.actions.length > 0) {
      await this.addActions(demo.demonstrationId, demo.actions);
    }

    return demo;
  }

  public async getById(id: string): Promise<Demonstration | undefined> {
    const rows = await this.db
      .select()
      .from(demonstrations)
      .where(eq(demonstrations.id, id))
      .limit(1);

    if (!rows[0]) return undefined;

    const actionRows = await this.db
      .select()
      .from(demonstrationActions)
      .where(eq(demonstrationActions.demonstrationId, id))
      .orderBy(asc(demonstrationActions.orderIndex));

    return this.mapDemonstration(rows[0], actionRows);
  }

  public async list(filter?: DemonstrationFilter): Promise<Demonstration[]> {
    let query = this.db.select().from(demonstrations).$dynamic();

    if (filter?.actorId && filter?.status) {
      query = query.where(
        and(eq(demonstrations.actorId, filter.actorId), eq(demonstrations.status, filter.status)),
      );
    } else if (filter?.actorId) {
      query = query.where(eq(demonstrations.actorId, filter.actorId));
    } else if (filter?.status) {
      query = query.where(eq(demonstrations.status, filter.status));
    }

    const rows = await query;
    const results: Demonstration[] = [];

    for (const row of rows) {
      const actionRows = await this.db
        .select()
        .from(demonstrationActions)
        .where(eq(demonstrationActions.demonstrationId, row.id))
        .orderBy(asc(demonstrationActions.orderIndex));

      results.push(this.mapDemonstration(row, actionRows));
    }

    return results;
  }

  public async addActions(demonstrationId: string, actions: SemanticAction[]): Promise<void> {
    const demo = await this.getById(demonstrationId);
    if (!demo) {
      throw new Error(`Demonstration '${demonstrationId}' not found.`);
    }

    let currentCount = demo.actions.length;

    for (const act of actions) {
      await this.db.insert(demonstrationActions).values({
        id: act.actionId,
        demonstrationId,
        actionType: act.actionType,
        actionVersion: act.actionVersion,
        arguments: act.arguments,
        actor: act.actor,
        timestamp: act.timestamp,
        sessionId: act.sessionId,
        result: act.result || null,
        sideEffects: act.sideEffects,
        reversibility: act.reversibility,
        provenance: act.provenance,
        correlationId: act.correlationId,
        orderIndex: currentCount++,
      });
    }
  }

  public async updateStatus(id: string, status: DemonstrationStatus): Promise<Demonstration> {
    const updated = await this.db
      .update(demonstrations)
      .set({
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null,
      })
      .where(eq(demonstrations.id, id))
      .returning();

    if (!updated[0]) {
      throw new Error(`Demonstration '${id}' not found.`);
    }

    const full = await this.getById(id);
    return full!;
  }

  private mapDemonstration(
    row: typeof demonstrations.$inferSelect,
    actionRows: (typeof demonstrationActions.$inferSelect)[],
  ): Demonstration {
    return {
      demonstrationId: row.id,
      sessionId: row.sessionId,
      actorId: row.actorId,
      startedAt: row.startedAt,
      completedAt: row.completedAt || undefined,
      status: row.status as DemonstrationStatus,
      applicationContext: row.applicationContext as any,
      metadata: (row.metadata as Record<string, unknown>) || {},
      actions: actionRows.map(a => ({
        actionId: a.id,
        actionType: a.actionType,
        actionVersion: a.actionVersion,
        arguments: a.arguments as Record<string, unknown>,
        actor: a.actor as any,
        timestamp: a.timestamp,
        sessionId: a.sessionId,
        demonstrationId: a.demonstrationId,
        result: (a.result as any) || undefined,
        sideEffects: (a.sideEffects as string[]) || [],
        reversibility: a.reversibility as any,
        provenance: a.provenance as any,
        correlationId: a.correlationId,
      })),
    };
  }
}
