export interface INonceStore {
  /**
   * Attempt to consume a nonce atomically.
   * Returns true if successfully consumed (first use).
   * Returns false if already consumed or expired (replay attack).
   */
  consume(nonce: string, ttlMs: number): Promise<boolean>;

  /**
   * Check if a nonce has already been consumed.
   */
  isConsumed(nonce: string): Promise<boolean>;

  /**
   * Optional cleanup of expired nonces.
   */
  cleanup?(): Promise<void>;
}

export class InMemoryNonceStore implements INonceStore {
  private consumedNonces = new Map<string, number>();

  public async consume(nonce: string, ttlMs: number): Promise<boolean> {
    const now = Date.now();
    const expiry = this.consumedNonces.get(nonce);

    if (expiry && expiry > now) {
      return false; // Already consumed
    }

    this.consumedNonces.set(nonce, now + ttlMs);
    return true;
  }

  public async isConsumed(nonce: string): Promise<boolean> {
    const expiry = this.consumedNonces.get(nonce);
    if (!expiry) return false;
    if (Date.now() > expiry) {
      this.consumedNonces.delete(nonce);
      return false;
    }
    return true;
  }

  public async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [nonce, expiry] of this.consumedNonces.entries()) {
      if (now > expiry) {
        this.consumedNonces.delete(nonce);
      }
    }
  }
}
