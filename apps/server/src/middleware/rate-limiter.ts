import { MiddlewareHandler } from 'hono';
import { CONSTANTS } from '@deputy/config';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const clientBuckets = new Map<string, RateLimitRecord>();

export function createRateLimiter(
  defaultMax: number = CONSTANTS.DEFAULT_RATE_LIMIT_MAX,
  windowMs: number = CONSTANTS.DEFAULT_RATE_LIMIT_WINDOW_MS,
): MiddlewareHandler {
  return async (c, next) => {
    // Extract client identifier (IP + actor + route prefix)
    const clientIp =
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      c.req.header('cf-connecting-ip') ||
      '127.0.0.1';

    const actor = c.req.header('x-actor-id') || 'anon';
    const path = c.req.path;

    // Route-sensitive limits: WebAuthn and execution endpoints are strictly guarded
    let maxRequests = defaultMax;
    if (path.includes('/auth/webauthn') || path.includes('/execute')) {
      maxRequests = Math.min(defaultMax, 30);
    } else if (path.includes('/authorizations') || path.includes('/tool-proposals')) {
      maxRequests = Math.min(defaultMax, 60);
    }

    const routePrefix = path.split('/')[2] || 'api';
    const bucketKey = `${clientIp}:${actor}:${routePrefix}`;

    const now = Date.now();
    let bucket = clientBuckets.get(bucketKey);

    if (!bucket || now > bucket.resetAt) {
      bucket = {
        count: 1,
        resetAt: now + windowMs,
      };
      clientBuckets.set(bucketKey, bucket);
    } else {
      bucket.count += 1;
    }

    c.header('X-RateLimit-Limit', String(maxRequests));
    c.header('X-RateLimit-Remaining', String(Math.max(0, maxRequests - bucket.count)));
    c.header('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > maxRequests) {
      return c.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests for this operation. Please retry later.',
            retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
            retryable: true,
          },
        },
        429,
      );
    }

    return next();
  };
}
