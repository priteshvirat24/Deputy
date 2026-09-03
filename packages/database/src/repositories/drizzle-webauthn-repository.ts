import { and, eq, isNull } from 'drizzle-orm';
import { WebAuthnCredential } from '@deputy/domain';
import { DatabaseInstance } from '../client.js';
import { webauthnCredentials } from '../schema/index.js';
import { IWebAuthnRepository } from './webauthn-repository.js';

export class DrizzleWebAuthnRepository implements IWebAuthnRepository {
  constructor(private readonly db: DatabaseInstance) {}

  public async create(cred: WebAuthnCredential): Promise<WebAuthnCredential> {
    const inserted = await this.db
      .insert(webauthnCredentials)
      .values({
        id: cred.id,
        actorId: cred.actorId,
        credentialId: cred.credentialId,
        publicKey: cred.publicKey,
        counter: cred.counter,
        transports: cred.transports || null,
        aaguid: cred.aaguid || null,
        createdAt: cred.createdAt,
        lastUsedAt: cred.lastUsedAt || null,
        revokedAt: cred.revokedAt || null,
      })
      .returning();

    return this.mapRow(inserted[0]!);
  }

  public async findByCredentialId(credentialId: string): Promise<WebAuthnCredential | null> {
    const rows = await this.db
      .select()
      .from(webauthnCredentials)
      .where(eq(webauthnCredentials.credentialId, credentialId))
      .limit(1);

    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  public async findByActorId(actorId: string): Promise<WebAuthnCredential[]> {
    const rows = await this.db
      .select()
      .from(webauthnCredentials)
      .where(and(eq(webauthnCredentials.actorId, actorId), isNull(webauthnCredentials.revokedAt)));

    return rows.map(r => this.mapRow(r));
  }

  public async updateCounter(credentialId: string, counter: number): Promise<void> {
    const updated = await this.db
      .update(webauthnCredentials)
      .set({
        counter,
        lastUsedAt: new Date(),
      })
      .where(eq(webauthnCredentials.credentialId, credentialId))
      .returning();

    if (!updated[0]) {
      throw new Error(`Credential '${credentialId}' not found.`);
    }
  }

  public async revoke(credentialId: string): Promise<void> {
    const updated = await this.db
      .update(webauthnCredentials)
      .set({
        revokedAt: new Date(),
      })
      .where(eq(webauthnCredentials.credentialId, credentialId))
      .returning();

    if (!updated[0]) {
      throw new Error(`Credential '${credentialId}' not found.`);
    }
  }

  public async listAll(): Promise<WebAuthnCredential[]> {
    const rows = await this.db.select().from(webauthnCredentials);
    return rows.map(r => this.mapRow(r));
  }

  private mapRow(row: typeof webauthnCredentials.$inferSelect): WebAuthnCredential {
    return {
      id: row.id,
      actorId: row.actorId,
      credentialId: row.credentialId,
      publicKey: row.publicKey,
      counter: row.counter,
      transports: (row.transports as any) || undefined,
      aaguid: row.aaguid || undefined,
      createdAt: row.createdAt,
      lastUsedAt: row.lastUsedAt || undefined,
      revokedAt: row.revokedAt || undefined,
    };
  }
}
