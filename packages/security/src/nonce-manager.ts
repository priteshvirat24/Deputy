import { randomBytes } from 'node:crypto';
import { CONSTANTS } from '@deputy/config';
import { InMemoryNonceStore, INonceStore } from './nonce-store.js';

export class NonceManager {
  private syncNonces = new Map<string, number>();
  private store: INonceStore;

  constructor(customStore?: INonceStore) {
    this.store = customStore || new InMemoryNonceStore();
  }

  /**
   * Generate a cryptographically secure random hex nonce.
   */
  public generateNonce(): string {
    return randomBytes(CONSTANTS.NONCE_LENGTH_BYTES).toString('hex');
  }

  /**
   * Consume a nonce synchronously using process memory.
   * Returns true if valid and unused, false if already used.
   */
  public consumeNonce(nonce: string): boolean {
    const now = Date.now();
    const expiry = this.syncNonces.get(nonce);

    if (expiry && expiry > now) {
      return false; // Replay attempt
    }

    this.syncNonces.set(nonce, now + CONSTANTS.MAX_AUTHORIZATION_TTL_MS);

    // Also inform store in background
    this.store.consume(nonce, CONSTANTS.MAX_AUTHORIZATION_TTL_MS).catch(() => {});

    // Periodic cleanup of expired nonces
    if (this.syncNonces.size > 1000) {
      for (const [k, exp] of this.syncNonces.entries()) {
        if (now > exp) {
          this.syncNonces.delete(k);
        }
      }
    }

    return true;
  }

  /**
   * Consume a nonce asynchronously using the distributed store.
   */
  public async consumeNonceAsync(nonce: string): Promise<boolean> {
    const consumedLocally = this.consumeNonce(nonce);
    if (!consumedLocally) return false;
    return this.store.consume(nonce, CONSTANTS.MAX_AUTHORIZATION_TTL_MS);
  }

  /**
   * Check if a nonce was consumed.
   */
  public async isConsumed(nonce: string): Promise<boolean> {
    const expiry = this.syncNonces.get(nonce);
    if (expiry && expiry > Date.now()) return true;
    return this.store.isConsumed(nonce);
  }
}
