import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { RiskLevel, ToolLifecycleState } from '@deputy/domain';
import { learnedToolSchema, updateToolStatusSchema } from '@deputy/schemas';
import { AppServices } from '../services/index.js';

export function createToolRoutes(services: AppServices) {
  const router = new Hono();

  // GET /api/tools
  router.get('/', async c => {
    const status = c.req.query('status') as ToolLifecycleState | undefined;
    const riskLevel = c.req.query('riskLevel') as RiskLevel | undefined;

    const tools = await services.toolRepo.list({ status, riskLevel });
    return c.json({ data: tools });
  });

  // GET /api/tools/:id
  router.get('/:id', async c => {
    const id = c.req.param('id');
    const tool = await services.toolRepo.getById(id);

    if (!tool) {
      return c.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: `Tool with ID '${id}' was not found.`,
          },
        },
        404,
      );
    }

    const versions = await services.toolRepo.listVersions(id);
    return c.json({ data: { ...tool, versions } });
  });

  // POST /api/tools
  router.post('/', zValidator('json', learnedToolSchema), async c => {
    const toolData = c.req.valid('json');

    // Invariant 2 & 11: Validate execution binding resolves to action registry
    const binding = toolData.executionBinding;
    let bindingValid = false;
    let failureDetail = '';

    if (binding.type === 'APPLICATION_ACTION') {
      bindingValid = services.actionRegistry.has(binding.actionId, binding.actionVersion);
      if (!bindingValid) {
        failureDetail = `'${binding.actionId}' (v${binding.actionVersion}) not found in trusted registry.`;
      }
    } else if (binding.type === 'COMPOSITE_ACTION') {
      const missingStep = binding.actions.find(
        s => !services.actionRegistry.has(s.actionId, s.actionVersion),
      );
      bindingValid = !missingStep;
      if (missingStep) {
        failureDetail = `Composite step '${missingStep.actionId}' (v${missingStep.actionVersion}) not found in trusted registry.`;
      }
    }

    if (!bindingValid) {
      return c.json(
        {
          error: {
            code: 'INVALID_EXECUTION_BINDING',
            message: `Execution binding must reference registered application actions. ${failureDetail}`,
          },
        },
        400,
      );
    }

    const created = await services.toolRepo.create(toolData);

    // Audit tool creation
    await services.auditRepo.append({
      eventId: `evt_${Date.now()}_reg`,
      timestamp: new Date(),
      eventType: 'TOOL_REGISTERED',
      actor: { id: toolData.creator.id, type: 'USER', role: toolData.creator.role },
      toolId: created.toolId,
      toolVersion: created.version,
      status: 'SUCCESS',
      metadata: {
        toolName: created.name,
        reversibility: created.reversibility,
        riskLevel: created.riskLevel,
      },
    });

    // If active, register in WebMCP adapter
    if (created.status === 'ACTIVE') {
      services.webmcpAdapter.registerTool(
        created,
        async (params: Record<string, unknown>, _signal?: AbortSignal) => {
          return services.toolExecutor.execute(
            {
              proposalId: `prop_direct_${Date.now()}`,
              toolId: created.toolId,
              toolVersion: created.version,
              arguments: params,
              requestId: `req_mcp_${Date.now()}`,
              proposedBy: { agentId: 'webmcp-agent', origin: 'local' },
              timestamp: new Date(),
            },
            created,
          );
        },
      );
    }

    return c.json({ data: created }, 201);
  });

  // PATCH /api/tools/:id/status
  router.patch('/:id/status', zValidator('json', updateToolStatusSchema), async c => {
    const id = c.req.param('id');
    const { status, reason } = c.req.valid('json');

    try {
      const updated = await services.toolRepo.updateStatus(id, status);

      // Audit lifecycle event
      const eventType =
        status === 'RETIRED'
          ? 'TOOL_RETIRED'
          : status === 'DISABLED'
            ? 'TOOL_DISABLED'
            : status === 'ACTIVE'
              ? 'TOOL_REGISTERED'
              : 'TOOL_VALIDATED';

      await services.auditRepo.append({
        eventId: `evt_${Date.now()}_status`,
        timestamp: new Date(),
        eventType,
        actor: { id: 'admin', type: 'USER' },
        toolId: id,
        toolVersion: updated.version,
        status: 'SUCCESS',
        reason,
      });

      // Update WebMCP capability lifecycle
      if (status === 'RETIRED' || status === 'DISABLED' || status === 'DELETED') {
        services.webmcpAdapter.retireTool(id, reason);
      }

      return c.json({ data: updated });
    } catch (err: unknown) {
      return c.json(
        {
          error: {
            code: 'LIFECYCLE_TRANSITION_FAILED',
            message: err instanceof Error ? err.message : String(err),
          },
        },
        400,
      );
    }
  });

  // DELETE /api/tools/:id
  router.delete('/:id', async c => {
    const id = c.req.param('id');
    try {
      // Transition to RETIRED or DELETED
      const updated = await services.toolRepo.updateStatus(id, 'DELETED');
      services.webmcpAdapter.retireTool(id, 'DELETED_BY_ADMIN');

      await services.auditRepo.append({
        eventId: `evt_${Date.now()}_del`,
        timestamp: new Date(),
        eventType: 'TOOL_RETIRED',
        actor: { id: 'admin', type: 'USER' },
        toolId: id,
        status: 'SUCCESS',
        reason: 'Tool marked DELETED',
      });

      return c.json({ data: updated, message: 'Tool lifecycle state transitioned to DELETED.' });
    } catch (err: unknown) {
      return c.json(
        {
          error: {
            code: 'DELETE_FAILED',
            message: err instanceof Error ? err.message : String(err),
          },
        },
        400,
      );
    }
  });

  return router;
}
