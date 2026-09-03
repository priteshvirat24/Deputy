export interface StoredChallenge {
  challenge: string;
  createdAt: Date;
  expiresAt: Date;
  actorId?: string;
  toolId?: string;
  toolVersion?: number;
  argumentDigest?: string;
  requestId?: string;
}

export class WebAuthnChallengeStore {
  private challenges = new Map<string, StoredChallenge>();

  /**
   * Save a challenge with bound parameters and expiration.
   */
  public store(challenge: string, metadata: Omit<StoredChallenge, 'challenge'>): void {
    this.challenges.set(challenge, {
      challenge,
      ...metadata,
    });
  }

  /**
   * Look up a challenge without consuming it.
   */
  public get(challenge: string): StoredChallenge | undefined {
    const entry = this.challenges.get(challenge);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt.getTime()) {
      this.challenges.delete(challenge);
      return undefined;
    }
    return { ...entry };
  }

  /**
   * Verify and atomically consume a challenge.
   * If valid and matching, removes the challenge and returns true.
   * If expired or missing, returns false.
   */
  public verifyAndConsume(
    challenge: string,
    expected?: {
      toolId?: string;
      toolVersion?: number;
      argumentDigest?: string;
      requestId?: string;
    },
  ): { valid: boolean; reason?: string } {
    const entry = this.challenges.get(challenge);

    if (!entry) {
      return { valid: false, reason: 'Challenge not found or already consumed.' };
    }

    // Atomic consumption
    this.challenges.delete(challenge);

    if (Date.now() > entry.expiresAt.getTime()) {
      return { valid: false, reason: 'Challenge has expired.' };
    }

    if (expected?.toolId && entry.toolId && entry.toolId !== expected.toolId) {
      return {
        valid: false,
        reason: `Challenge bound to tool '${entry.toolId}', but invocation targeted '${expected.toolId}'.`,
      };
    }

    if (expected?.toolVersion && entry.toolVersion && entry.toolVersion !== expected.toolVersion) {
      return {
        valid: false,
        reason: `Challenge bound to tool version v${entry.toolVersion}, but invocation targeted v${expected.toolVersion}.`,
      };
    }

    if (
      expected?.argumentDigest &&
      entry.argumentDigest &&
      entry.argumentDigest !== expected.argumentDigest
    ) {
      return {
        valid: false,
        reason: `Challenge argument digest does not match invocation arguments.`,
      };
    }

    if (expected?.requestId && entry.requestId && entry.requestId !== expected.requestId) {
      return {
        valid: false,
        reason: `Challenge request ID mismatch.`,
      };
    }

    return { valid: true };
  }

  /**
   * Prune expired challenges.
   */
  public cleanup(): void {
    const now = Date.now();
    for (const [k, v] of this.challenges.entries()) {
      if (now > v.expiresAt.getTime()) {
        this.challenges.delete(k);
      }
    }
  }
}
