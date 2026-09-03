import { MiddlewareHandler } from 'hono';

interface CachedResponse {
  status: number;
  body: unknown;
  timestamp: number;
}

// In-memory idempotency cache with 10-minute TTL
const idempotencyCache = new Map<string, CachedResponse>();
const CACHE_TTL_MS = 10 * 60 * 1000;

export function idempotencyMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    // Only apply to state-modifying requests
    if (c.req.method !== 'POST' && c.req.method !== 'PUT' && c.req.method !== 'DELETE') {
      return next();
    }

    const key = c.req.header('idempotency-key') || c.req.header('x-idempotency-key');
    if (!key) {
      return next();
    }

    const now = Date.now();
    const cached = idempotencyCache.get(key);

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      c.header('x-idempotency-replayed', 'true');
      return c.json(cached.body, cached.status as any);
    }

    await next();

    // Cache successful or client-side responses
    if (c.res.status >= 200 && c.res.status < 500) {
      try {
        const cloned = c.res.clone();
        const body = await cloned.json();
        idempotencyCache.set(key, {
          status: c.res.status,
          body,
          timestamp: now,
        });
      } catch {
        // Response wasn't JSON, skip caching
      }
    }

    // Periodic cleanup
    if (idempotencyCache.size > 2000) {
      for (const [k, v] of idempotencyCache.entries()) {
        if (now - v.timestamp > CACHE_TTL_MS) {
          idempotencyCache.delete(k);
        }
      }
    }
  };
}
