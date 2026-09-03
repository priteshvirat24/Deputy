import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { authorizationSchema } from '@deputy/schemas';
import { AppServices } from '../services/index.js';

export function createAuthorizationRoutes(services: AppServices) {
  const router = new Hono();

  // POST /api/authorizations
  router.post('/', zValidator('json', authorizationSchema), async c => {
    const authData = c.req.valid('json');

    // Verify tool exists
    const tool = await services.toolRepo.getById(authData.toolId);
    if (!tool) {
      return c.json(
        {
          error: {
            code: 'TOOL_NOT_FOUND',
            message: `Cannot authorize execution for non-existent tool '${authData.toolId}'.`,
          },
        },
        400,
      );
    }

    const created = await services.authorizationRepo.create(authData);

    await services.auditRepo.append({
      eventId: `evt_${Date.now()}_auth_grant`,
      timestamp: new Date(),
      eventType: 'AUTHORIZATION_GRANTED',
      actor: { id: authData.actor.id, type: 'USER', role: authData.actor.role },
      requestId: authData.requestId,
      toolId: authData.toolId,
      toolVersion: authData.toolVersion,
      status: 'SUCCESS',
      metadata: { argumentDigest: authData.argumentDigest, nonce: authData.nonce },
    });

    return c.json({ data: created }, 201);
  });

  // GET /api/authorizations/:id
  router.get('/:id', async c => {
    const id = c.req.param('id');
    const auth = await services.authorizationRepo.getById(id);

    if (!auth) {
      return c.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: `Authorization '${id}' was not found.`,
          },
        },
        404,
      );
    }

    return c.json({ data: auth });
  });

  return router;
}
