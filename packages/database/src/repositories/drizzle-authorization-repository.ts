import { and, eq, gt } from 'drizzle-orm';
import { Authorization, AuthorizationStatus } from '@deputy/domain';
import { DatabaseInstance } from '../client.js';
import { authorizations } from '../schema/index.js';
import { IAuthorizationRepository } from './authorization-repository.js';

export class DrizzleAuthorizationRepository implements IAuthorizationRepository {
  constructor(private readonly db: DatabaseInstance) {}

  public async create(auth: Authorization): Promise<Authorization> {
    const inserted = await this.db
      .insert(authorizations)
      .values({
        id: auth.authorizationId,
        requestId: auth.requestId,
        toolId: auth.toolId,
        toolVersion: auth.toolVersion,
        argumentDigest: auth.argumentDigest,
        authorizationMethod: auth.authorizationMethod,
        actor: auth.actor,
        issuedAt: auth.issuedAt,
        expiresAt: auth.expiresAt,
        nonce: auth.nonce,
        status: auth.status,
        webauthnAssertion: auth.webauthnAssertion,
        credentialReference: auth.credentialReference,
        consumedAt: auth.consumedAt,
        consumedByProposalId: auth.consumedByProposalId,
        revokedAt: auth.revokedAt,
        revocationReason: auth.revocationReason,
      })
      .returning();

    return this.mapRow(inserted[0]!);
  }

  public async getById(id: string): Promise<Authorization | undefined> {
    const rows = await this.db
      .select()
      .from(authorizations)
      .where(eq(authorizations.id, id))
      .limit(1);

    return rows[0] ? this.mapRow(rows[0]) : undefined;
  }

  public async getByRequestId(requestId: string): Promise<Authorization | undefined> {
    const rows = await this.db
      .select()
      .from(authorizations)
      .where(eq(authorizations.requestId, requestId))
      .limit(1);

    return rows[0] ? this.mapRow(rows[0]) : undefined;
  }

  public async getByNonce(nonce: string): Promise<Authorization | undefined> {
    const rows = await this.db
      .select()
      .from(authorizations)
      .where(eq(authorizations.nonce, nonce))
      .limit(1);

    return rows[0] ? this.mapRow(rows[0]) : undefined;
  }

  public async updateStatus(
    id: string,
    status: AuthorizationStatus,
    revocationReason?: string,
  ): Promise<Authorization> {
    const updateData: Record<string, unknown> = { status };
    if (status === 'REVOKED') {
      updateData['revokedAt'] = new Date();
      if (revocationReason) {
        updateData['revocationReason'] = revocationReason;
      }
    }

    const updated = await this.db
      .update(authorizations)
      .set(updateData)
      .where(eq(authorizations.id, id))
      .returning();

    if (!updated[0]) {
      throw new Error(`Authorization with ID '${id}' not found`);
    }

    return this.mapRow(updated[0]);
  }

  /**
   * Atomically verify and consume a single-use authorization for a proposal.
   * Guarantees distributed atomic correctness across multiple server instances.
   */
  public async consume(
    id: string,
    proposalId: string,
    expectedDigest: string,
  ): Promise<Authorization> {
    const now = new Date();

    // Atomic conditional update in PostgreSQL
    const updatedRows = await this.db
      .update(authorizations)
      .set({
        status: 'CONSUMED',
        consumedAt: now,
        consumedByProposalId: proposalId,
      })
      .where(
        and(
          eq(authorizations.id, id),
          eq(authorizations.status, 'AUTHORIZED'),
          eq(authorizations.argumentDigest, expectedDigest),
          gt(authorizations.expiresAt, now),
        ),
      )
      .returning();

    if (updatedRows.length > 0) {
      return this.mapRow(updatedRows[0]!);
    }

    // Fail-closed diagnostic evaluation
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`AUTHORIZATION_NOT_FOUND: Authorization '${id}' does not exist.`);
    }
    if (existing.status === 'CONSUMED') {
      throw new Error(
        `ALREADY_CONSUMED: Authorization '${id}' has already been consumed (replay attack detected).`,
      );
    }
    if (existing.expiresAt.getTime() <= now.getTime()) {
      throw new Error(`AUTHORIZATION_EXPIRED: Authorization '${id}' has expired.`);
    }
    if (existing.argumentDigest !== expectedDigest) {
      throw new Error(
        `ARGUMENT_DIGEST_MISMATCH: Authorization argument digest does not match proposal.`,
      );
    }
    if (existing.status !== 'AUTHORIZED') {
      throw new Error(
        `AUTHORIZATION_INVALID: Authorization status is '${existing.status}', expected 'AUTHORIZED'.`,
      );
    }
    throw new Error(
      `AUTHORIZATION_CONSUMPTION_FAILED: Could not atomically consume authorization '${id}'.`,
    );
  }

  public async list(filter?: {
    toolId?: string;
    status?: AuthorizationStatus;
  }): Promise<Authorization[]> {
    let query = this.db.select().from(authorizations).$dynamic();

    if (filter?.toolId && filter?.status) {
      query = query.where(
        and(eq(authorizations.toolId, filter.toolId), eq(authorizations.status, filter.status)),
      );
    } else if (filter?.toolId) {
      query = query.where(eq(authorizations.toolId, filter.toolId));
    } else if (filter?.status) {
      query = query.where(eq(authorizations.status, filter.status));
    }

    const rows = await query;
    return rows.map(r => this.mapRow(r));
  }

  private mapRow(row: typeof authorizations.$inferSelect): Authorization {
    return {
      authorizationId: row.id,
      requestId: row.requestId,
      toolId: row.toolId,
      toolVersion: row.toolVersion,
      argumentDigest: row.argumentDigest,
      authorizationMethod: row.authorizationMethod as any,
      actor: row.actor as any,
      issuedAt: row.issuedAt,
      expiresAt: row.expiresAt,
      nonce: row.nonce,
      status: row.status as AuthorizationStatus,
      webauthnAssertion: (row.webauthnAssertion as any) || undefined,
      credentialReference: row.credentialReference || undefined,
      consumedAt: row.consumedAt || undefined,
      consumedByProposalId: row.consumedByProposalId || undefined,
      revokedAt: row.revokedAt || undefined,
      revocationReason: row.revocationReason || undefined,
    };
  }
}
