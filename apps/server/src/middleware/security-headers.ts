import { MiddlewareHandler } from 'hono';
import { getEnv } from '@deputy/config';

export const securityHeadersMiddleware: MiddlewareHandler = async (c, next) => {
  // Body size protection: reject payloads exceeding 1MB
  const contentLength = c.req.header('content-length');
  if (contentLength && parseInt(contentLength, 10) > 1024 * 1024) {
    return c.json(
      {
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Request payload exceeds maximum allowed size of 1MB.',
          retryable: false,
        },
      },
      413,
    );
  }

  await next();

  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  c.header(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none';",
  );

  const env = getEnv();
  if (env.NODE_ENV === 'production') {
    c.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  return;
};
