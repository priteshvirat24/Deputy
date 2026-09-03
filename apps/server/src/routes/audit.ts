import { Hono } from 'hono';
import { AuditEventType } from '@deputy/domain';
import { AppServices } from '../services/index.js';

export function createAuditRoutes(services: AppServices) {
  const router = new Hono();

  // GET /api/audit
  router.get('/', async c => {
    const toolId = c.req.query('toolId');
    const eventType = c.req.query('eventType') as AuditEventType | undefined;
    const actorId = c.req.query('actorId');
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!, 10) : 100;

    const events = await services.auditRepo.list({
      toolId,
      eventType,
      actorId,
      limit,
    });

    return c.json({ data: events });
  });

  return router;
}
