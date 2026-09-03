import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import {
  approveCandidateRequestSchema,
  compareDemonstrationsRequestSchema,
  synthesizeToolRequestSchema,
} from '@deputy/schemas';
import { AlignmentEngine } from '@deputy/synthesis';
import { AppServices } from '../services/index.js';

export function createSynthesisRoutes(services: AppServices) {
  const router = new Hono();
  const alignmentEngine = new AlignmentEngine();

  // POST /api/synthesis/compare
  router.post('/compare', zValidator('json', compareDemonstrationsRequestSchema), async c => {
    const { demonstrationIds } = c.req.valid('json');

    const demos = await Promise.all(
      demonstrationIds.map(id => services.demonstrationRepo.getById(id)),
    );

    const missing = demonstrationIds.filter((_, idx) => !demos[idx]);
    if (missing.length > 0) {
      return c.json(
        {
          error: {
            code: 'DEMONSTRATIONS_NOT_FOUND',
            message: `Demonstrations not found: ${missing.join(', ')}`,
          },
        },
        404,
      );
    }

    const validDemos = demos.filter(Boolean) as NonNullable<(typeof demos)[0]>[];

    try {
      const aligned = alignmentEngine.align(validDemos);
      return c.json({ data: aligned });
    } catch (err: unknown) {
      return c.json(
        {
          error: {
            code: 'ALIGNMENT_FAILED',
            message: err instanceof Error ? err.message : String(err),
          },
        },
        400,
      );
    }
  });

  // POST /api/synthesis/synthesize
  router.post('/synthesize', zValidator('json', synthesizeToolRequestSchema), async c => {
    const { demonstrationIds, toolNameOverride, descriptionOverride } = c.req.valid('json');

    const demos = await Promise.all(
      demonstrationIds.map(id => services.demonstrationRepo.getById(id)),
    );

    const missing = demonstrationIds.filter((_, idx) => !demos[idx]);
    if (missing.length > 0) {
      return c.json(
        {
          error: {
            code: 'DEMONSTRATIONS_NOT_FOUND',
            message: `Demonstrations not found: ${missing.join(', ')}`,
          },
        },
        404,
      );
    }

    const validDemos = demos.filter(Boolean) as NonNullable<(typeof demos)[0]>[];

    try {
      const result = services.synthesisEngine.synthesize(validDemos, services.actionRegistry, {
        toolNameOverride,
        descriptionOverride,
      });

      // Save candidate in candidateTools memory store for review
      services.candidateTools.set(result.candidateTool.toolId, result);

      // Audit synthesis
      await services.auditRepo.append({
        eventId: `evt_${Date.now()}_syn_cand`,
        timestamp: new Date(),
        eventType: 'TOOL_CANDIDATE_CREATED',
        actor: { id: 'synthesis_engine', type: 'SYSTEM' },
        toolId: result.candidateTool.toolId,
        toolVersion: 1,
        status: 'SUCCESS',
        metadata: {
          demonstrations: demonstrationIds,
          confidence: result.report.confidence,
          confidenceScore: result.report.confidenceScore,
          parametersInferred: result.report.inferredParameters.length,
        },
      });

      return c.json({ data: result }, 201);
    } catch (err: unknown) {
      return c.json(
        {
          error: {
            code: 'SYNTHESIS_FAILED',
            message: err instanceof Error ? err.message : String(err),
          },
        },
        400,
      );
    }
  });

  // POST /api/synthesis/approve
  router.post('/approve', zValidator('json', approveCandidateRequestSchema), async c => {
    const { toolId, name, description, inputSchema } = c.req.valid('json');

    const candidateResult = services.candidateTools.get(toolId);
    if (!candidateResult) {
      return c.json(
        {
          error: {
            code: 'CANDIDATE_NOT_FOUND',
            message: `Candidate tool '${toolId}' not found in pending review.`,
          },
        },
        404,
      );
    }

    const tool = candidateResult.candidateTool;

    // Apply verified human updates to metadata
    tool.name = name;
    tool.description = description;
    tool.inputSchema = inputSchema;
    tool.status = 'ACTIVE';
    tool.updatedAt = new Date();

    // Invariant 2 & 11 check: Execution binding remains strictly registered action
    if (tool.executionBinding.type === 'APPLICATION_ACTION') {
      if (
        !services.actionRegistry.has(
          tool.executionBinding.actionId,
          tool.executionBinding.actionVersion,
        )
      ) {
        return c.json(
          {
            error: {
              code: 'INVALID_BINDING',
              message: 'Target action does not exist in registry.',
            },
          },
          400,
        );
      }
    } else if (tool.executionBinding.type === 'COMPOSITE_ACTION') {
      for (const step of tool.executionBinding.actions) {
        if (!services.actionRegistry.has(step.actionId, step.actionVersion)) {
          return c.json(
            {
              error: {
                code: 'INVALID_BINDING',
                message: `Step action '${step.actionId}' does not exist.`,
              },
            },
            400,
          );
        }
      }
    }

    // Persist tool in tool repository
    const created = await services.toolRepo.create(tool);

    // Register active tool into WebMCP surface
    services.webmcpAdapter.registerTool(created, async (params, _signal) => {
      return services.toolExecutor.execute(
        {
          proposalId: `prop_direct_${Date.now()}`,
          toolId: created.toolId,
          toolVersion: created.version,
          arguments: params,
          requestId: `req_mcp_${Date.now()}`,
          proposedBy: { agentId: 'webmcp_agent', origin: 'local' },
          timestamp: new Date(),
        },
        created,
      );
    });

    // Audit approval and activation
    await services.auditRepo.append({
      eventId: `evt_${Date.now()}_appr`,
      timestamp: new Date(),
      eventType: 'TOOL_REGISTERED',
      actor: { id: 'reviewer', type: 'USER' },
      toolId: created.toolId,
      toolVersion: created.version,
      status: 'SUCCESS',
      reason: 'Candidate approved by human operator and activated in WebMCP.',
    });

    services.candidateTools.delete(toolId);

    return c.json({
      data: created,
      message: 'Tool successfully approved and registered with WebMCP.',
    });
  });

  return router;
}
