import { and, desc, eq } from 'drizzle-orm';
import {
  isValidLifecycleTransition,
  LearnedTool,
  ToolLifecycleState,
  ToolVersionRecord,
} from '@deputy/domain';
import { DatabaseInstance } from '../client.js';
import { learnedTools, learnedToolVersions } from '../schema/index.js';
import { IToolRepository, ToolFilter } from './tool-repository.js';

export class DrizzleToolRepository implements IToolRepository {
  constructor(private readonly db: DatabaseInstance) {}

  public async create(tool: LearnedTool): Promise<LearnedTool> {
    const existing = await this.getById(tool.toolId);
    if (existing) {
      throw new Error(`Tool with ID '${tool.toolId}' already exists.`);
    }

    const inserted = await this.db
      .insert(learnedTools)
      .values({
        id: tool.toolId,
        name: tool.name,
        description: tool.description,
        version: tool.version,
        inputSchema: tool.inputSchema,
        executionBinding: tool.executionBinding,
        sourceDemonstrations: tool.sourceDemonstrations,
        demonstrationCount: tool.demonstrationCount,
        parameterProvenance: tool.parameterProvenance,
        reversibility: tool.reversibility,
        riskLevel: tool.riskLevel,
        approvalPolicy: tool.approvalPolicy,
        status: tool.status,
        creatorId: tool.creator.id,
        creatorRole: tool.creator.role,
        provenance: tool.provenance,
        originRestrictions: tool.originRestrictions,
        createdAt: tool.createdAt,
        updatedAt: tool.updatedAt,
      })
      .returning();

    const created = this.mapRow(inserted[0]!);

    // Snapshot immutable version record
    await this.saveVersion({
      toolId: created.toolId,
      version: created.version,
      definition: created,
      createdAt: new Date(),
      changelog: 'Initial version',
    });

    return created;
  }

  public async getById(id: string): Promise<LearnedTool | undefined> {
    const rows = await this.db.select().from(learnedTools).where(eq(learnedTools.id, id)).limit(1);

    return rows[0] ? this.mapRow(rows[0]) : undefined;
  }

  public async getByName(name: string): Promise<LearnedTool | undefined> {
    const rows = await this.db
      .select()
      .from(learnedTools)
      .where(eq(learnedTools.name, name))
      .limit(1);

    return rows[0] ? this.mapRow(rows[0]) : undefined;
  }

  public async list(filter?: ToolFilter): Promise<LearnedTool[]> {
    let query = this.db.select().from(learnedTools).$dynamic();

    if (filter?.status && filter?.riskLevel) {
      query = query.where(
        and(eq(learnedTools.status, filter.status), eq(learnedTools.riskLevel, filter.riskLevel)),
      );
    } else if (filter?.status) {
      query = query.where(eq(learnedTools.status, filter.status));
    } else if (filter?.riskLevel) {
      query = query.where(eq(learnedTools.riskLevel, filter.riskLevel));
    }

    const rows = await query;
    return rows.map(r => this.mapRow(r));
  }

  public async updateStatus(id: string, newStatus: ToolLifecycleState): Promise<LearnedTool> {
    const current = await this.getById(id);
    if (!current) {
      throw new Error(`Tool with ID '${id}' not found.`);
    }

    if (!isValidLifecycleTransition(current.status, newStatus)) {
      throw new Error(
        `Invalid lifecycle transition from '${current.status}' to '${newStatus}' for tool '${id}'.`,
      );
    }

    const updated = await this.db
      .update(learnedTools)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(learnedTools.id, id))
      .returning();

    return this.mapRow(updated[0]!);
  }

  public async saveVersion(record: ToolVersionRecord): Promise<void> {
    await this.db
      .insert(learnedToolVersions)
      .values({
        id: `ver_${record.toolId}_${record.version}`,
        toolId: record.toolId,
        version: record.version,
        definition: record.definition,
        changelog: record.changelog || null,
        createdAt: record.createdAt,
      })
      .onConflictDoNothing();
  }

  public async getVersion(toolId: string, version: number): Promise<ToolVersionRecord | undefined> {
    const rows = await this.db
      .select()
      .from(learnedToolVersions)
      .where(and(eq(learnedToolVersions.toolId, toolId), eq(learnedToolVersions.version, version)))
      .limit(1);

    if (!rows[0]) return undefined;

    return {
      toolId: rows[0].toolId,
      version: rows[0].version,
      definition: rows[0].definition as any,
      createdAt: rows[0].createdAt,
      changelog: rows[0].changelog || undefined,
    };
  }

  public async listVersions(toolId: string): Promise<ToolVersionRecord[]> {
    const rows = await this.db
      .select()
      .from(learnedToolVersions)
      .where(eq(learnedToolVersions.toolId, toolId))
      .orderBy(desc(learnedToolVersions.version));

    return rows.map(r => ({
      toolId: r.toolId,
      version: r.version,
      definition: r.definition as any,
      createdAt: r.createdAt,
      changelog: r.changelog || undefined,
    }));
  }

  private mapRow(row: typeof learnedTools.$inferSelect): LearnedTool {
    return {
      toolId: row.id,
      name: row.name,
      description: row.description,
      version: row.version,
      inputSchema: row.inputSchema as any,
      executionBinding: row.executionBinding as any,
      sourceDemonstrations: (row.sourceDemonstrations as string[]) || [],
      demonstrationCount: row.demonstrationCount,
      parameterProvenance: (row.parameterProvenance as any) || {},
      reversibility: row.reversibility as any,
      riskLevel: row.riskLevel as any,
      approvalPolicy: row.approvalPolicy as any,
      status: row.status as ToolLifecycleState,
      creator: {
        id: row.creatorId,
        role: row.creatorRole,
      },
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      provenance: row.provenance as any,
      originRestrictions: (row.originRestrictions as string[]) || [],
    };
  }
}
