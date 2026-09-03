import { WebAuthnCredential } from '@deputy/domain';

export interface IWebAuthnRepository {
  create(cred: WebAuthnCredential): Promise<WebAuthnCredential>;
  findByCredentialId(credentialId: string): Promise<WebAuthnCredential | null>;
  findByActorId(actorId: string): Promise<WebAuthnCredential[]>;
  updateCounter(credentialId: string, counter: number): Promise<void>;
  revoke(credentialId: string): Promise<void>;
  listAll(): Promise<WebAuthnCredential[]>;
}

export class InMemoryWebAuthnRepository implements IWebAuthnRepository {
  private credentials = new Map<string, WebAuthnCredential>();

  public async create(cred: WebAuthnCredential): Promise<WebAuthnCredential> {
    if (this.credentials.has(cred.credentialId)) {
      throw new Error(`WebAuthn credential with ID '${cred.credentialId}' already exists.`);
    }
    const stored = { ...cred };
    this.credentials.set(cred.credentialId, stored);
    return stored;
  }

  public async findByCredentialId(credentialId: string): Promise<WebAuthnCredential | null> {
    const cred = this.credentials.get(credentialId);
    return cred ? { ...cred } : null;
  }

  public async findByActorId(actorId: string): Promise<WebAuthnCredential[]> {
    return Array.from(this.credentials.values())
      .filter(c => c.actorId === actorId && !c.revokedAt)
      .map(c => ({ ...c }));
  }

  public async updateCounter(credentialId: string, counter: number): Promise<void> {
    const cred = this.credentials.get(credentialId);
    if (!cred) {
      throw new Error(`Credential '${credentialId}' not found.`);
    }
    cred.counter = counter;
    cred.lastUsedAt = new Date();
  }

  public async revoke(credentialId: string): Promise<void> {
    const cred = this.credentials.get(credentialId);
    if (!cred) {
      throw new Error(`Credential '${credentialId}' not found.`);
    }
    cred.revokedAt = new Date();
  }

  public async listAll(): Promise<WebAuthnCredential[]> {
    return Array.from(this.credentials.values()).map(c => ({ ...c }));
  }
}
