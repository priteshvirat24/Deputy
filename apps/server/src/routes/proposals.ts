import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { toolProposalSchema } from '@deputy/schemas';
import { computeArgumentDigest } from '@deputy/security';
import { AppServices } from '../services/index.js';

export function createProposalRoutes(services: AppServices) {
  const router = new Hono();

  // POST /api/tool-proposals
  router.post('/', zValidator('json', toolProposalSchema), async c => {
    const proposal = c.req.valid('json');

    // 1. Audit proposal receipt
    await services.auditRepo.append({
      eventId: `evt_${Date.now()}_prop`,
      timestamp: new Date(),
      eventType: 'TOOL_INVOCATION_PROPOSED',
      actor: { id: proposal.proposedBy.agentId, type: 'AGENT' },
      requestId: proposal.requestId,
      toolId: proposal.toolId,
      toolVersion: proposal.toolVersion,
      status: 'INFO',
    });

    // 2. Lookup tool
    const tool = await services.toolRepo.getById(proposal.toolId);
    if (!tool) {
      await services.auditRepo.append({
        eventId: `evt_${Date.now()}_refused`,
        timestamp: new Date(),
        eventType: 'TOOL_INVOCATION_REFUSED',
        actor: { id: proposal.proposedBy.agentId, type: 'AGENT' },
        requestId: proposal.requestId,
        toolId: proposal.toolId,
        status: 'FAILURE',
        reason: 'Tool does not exist',
      });

      return c.json(
        {
          error: {
            code: 'TOOL_NOT_FOUND',
            message: `Tool '${proposal.toolId}' does not exist.`,
          },
        },
        404,
      );
    }

    // 3. Lookup authorization if provided in header or body
    const authId = c.req.header('x-deputy-authorization-id');
    let authorization = authId ? await services.authorizationRepo.getById(authId) : undefined;
    if (!authorization) {
      authorization = await services.authorizationRepo.getByRequestId(proposal.requestId);
    }

    // 4. Evaluate policy
    const context = {
      origin: proposal.proposedBy.origin,
      authorization,
    };

    const policyDecision = await services.policyEngine.evaluate(proposal, tool, context);

    if (policyDecision.decision === 'DENY') {
      await services.auditRepo.append({
        eventId: `evt_${Date.now()}_denied`,
        timestamp: new Date(),
        eventType: 'TOOL_INVOCATION_REFUSED',
        actor: { id: proposal.proposedBy.agentId, type: 'AGENT' },
        requestId: proposal.requestId,
        toolId: proposal.toolId,
        status: 'FAILURE',
        reason: policyDecision.reason,
      });

      return c.json(
        {
          decision: 'DENY',
          reason: policyDecision.reason,
          rule: policyDecision.policyRule,
        },
        403,
      );
    }

    if (policyDecision.decision === 'REQUIRE_HUMAN_AUTHORIZATION') {
      const argumentDigest = computeArgumentDigest(proposal.arguments);

      await services.auditRepo.append({
        eventId: `evt_${Date.now()}_auth_req`,
        timestamp: new Date(),
        eventType: 'AUTHORIZATION_REQUESTED',
        actor: { id: proposal.proposedBy.agentId, type: 'AGENT' },
        requestId: proposal.requestId,
        toolId: proposal.toolId,
        status: 'INFO',
        metadata: { argumentDigest, riskLevel: tool.riskLevel },
      });

      return c.json(
        {
          decision: 'REQUIRE_HUMAN_AUTHORIZATION',
          reason: policyDecision.reason,
          requirement: {
            requestId: proposal.requestId,
            toolId: tool.toolId,
            toolVersion: tool.version,
            argumentDigest,
            riskLevel: tool.riskLevel,
            reversibility: tool.reversibility,
            requiredRoles: tool.approvalPolicy.requiredRoles,
          },
        },
        202,
      );
    }

    // 5. Execution allowed: execute through execution gate
    const executionResult = await services.toolExecutor.execute(proposal, tool, authorization);

    await services.auditRepo.append({
      eventId: `evt_${Date.now()}_exec`,
      timestamp: new Date(),
      eventType: executionResult.success ? 'TOOL_EXECUTED' : 'TOOL_EXECUTION_FAILED',
      actor: { id: proposal.proposedBy.agentId, type: 'AGENT' },
      requestId: proposal.requestId,
      toolId: tool.toolId,
      toolVersion: tool.version,
      status: executionResult.success ? 'SUCCESS' : 'FAILURE',
      reason: executionResult.error?.message,
    });

    return c.json({
      decision: 'ALLOW',
      execution: executionResult,
    });
  });

  return router;
}
