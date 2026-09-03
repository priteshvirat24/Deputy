import { Authorization, AuthorizationStatus } from '@deputy/domain';

export interface IAuthorizationRepository {
  create(auth: Authorization): Promise<Authorization>;
  getById(id: string): Promise<Authorization | undefined>;
  getByRequestId(requestId: string): Promise<Authorization | undefined>;
  getByNonce(nonce: string): Promise<Authorization | undefined>;
  updateStatus(
    id: string,
    status: AuthorizationStatus,
    revocationReason?: string,
  ): Promise<Authorization>;
  /**
   * Atomically verify and consume a single-use authorization for a proposal.
   * If already consumed or invalid, throws immediately.
   */
  consume(id: string, proposalId: string, expectedDigest: string): Promise<Authorization>;
  list(filter?: { toolId?: string; status?: AuthorizationStatus }): Promise<Authorization[]>;
}

export class InMemoryAuthorizationRepository implements IAuthorizationRepository {
  private authorizations = new Map<string, Authorization>();
  private activeLocks = new Set<string>();

  public async create(auth: Authorization): Promise<Authorization> {
    const cloned: Authorization = JSON.parse(JSON.stringify(auth));
    this.authorizations.set(auth.authorizationId, cloned);
    return cloned;
  }

  public async getById(id: string): Promise<Authorization | undefined> {
    const auth = this.authorizations.get(id);
    return auth ? JSON.parse(JSON.stringify(auth)) : undefined;
  }

  public async getByRequestId(requestId: string): Promise<Authorization | undefined> {
    for (const auth of this.authorizations.values()) {
      if (auth.requestId === requestId) {
        return JSON.parse(JSON.stringify(auth));
      }
    }
    return undefined;
  }

  public async getByNonce(nonce: string): Promise<Authorization | undefined> {
    for (const auth of this.authorizations.values()) {
      if (auth.nonce === nonce) {
        return JSON.parse(JSON.stringify(auth));
      }
    }
    return undefined;
  }

  public async updateStatus(
    id: string,
    status: AuthorizationStatus,
    revocationReason?: string,
  ): Promise<Authorization> {
    const auth = this.authorizations.get(id);
    if (!auth) {
      throw new Error(`Authorization '${id}' not found.`);
    }

    auth.status = status;
    if (status === 'REVOKED') {
      auth.revokedAt = new Date();
      auth.revocationReason = revocationReason;
    }

    return JSON.parse(JSON.stringify(auth));
  }

  public async consume(
    id: string,
    proposalId: string,
    expectedDigest: string,
  ): Promise<Authorization> {
    // Atomic test-and-set concurrency guard
    if (this.activeLocks.has(id)) {
      throw new Error(
        `CONCURRENT_CONSUMPTION: Authorization '${id}' is currently being consumed by another operation.`,
      );
    }
    this.activeLocks.add(id);

    try {
      const auth = this.authorizations.get(id);
      if (!auth) {
        throw new Error(`AUTHORIZATION_NOT_FOUND: Authorization '${id}' not found.`);
      }

      if (auth.status === 'CONSUMED') {
        throw new Error(
          `ALREADY_CONSUMED: Authorization '${id}' has already been consumed by proposal '${auth.consumedByProposalId}'.`,
        );
      }

      if (auth.status !== 'AUTHORIZED') {
        throw new Error(
          `AUTHORIZATION_INVALID: Authorization '${id}' is in status '${auth.status}', expected 'AUTHORIZED'.`,
        );
      }

      if (new Date() > new Date(auth.expiresAt)) {
        auth.status = 'EXPIRED';
        throw new Error(`AUTHORIZATION_EXPIRED: Authorization '${id}' has expired.`);
      }

      if (auth.argumentDigest !== expectedDigest) {
        throw new Error(
          `ARGUMENT_DIGEST_MISMATCH: Authorization argument digest does not match proposal digest.`,
        );
      }

      // Single-use transition
      auth.status = 'CONSUMED';
      auth.consumedAt = new Date();
      auth.consumedByProposalId = proposalId;

      return JSON.parse(JSON.stringify(auth));
    } finally {
      this.activeLocks.delete(id);
    }
  }

  public async list(filter?: {
    toolId?: string;
    status?: AuthorizationStatus;
  }): Promise<Authorization[]> {
    let result = Array.from(this.authorizations.values());

    if (filter?.toolId) {
      result = result.filter(a => a.toolId === filter.toolId);
    }
    if (filter?.status) {
      result = result.filter(a => a.status === filter.status);
    }

    return result.map(a => JSON.parse(JSON.stringify(a)));
  }
}
