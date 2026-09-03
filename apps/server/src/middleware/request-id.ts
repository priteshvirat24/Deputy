import { randomUUID } from 'node:crypto';
import { MiddlewareHandler } from 'hono';

export const requestIdMiddleware: MiddlewareHandler = async (c, next) => {
  const incomingId = c.req.header('x-request-id');
  const requestId = incomingId || `req_${randomUUID()}`;
  c.set('requestId', requestId);
  c.header('x-request-id', requestId);
  await next();
};
