import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { ContentEnvelope } from '@deputy/security';
import { AppServices } from '../services/index.js';

/**
 * QUARANTINE boundary — live. Wraps caller-supplied (untrusted) content in a
 * provenance-tagged envelope and runs the real QuarantinePolicyEngine over it:
 * byte/character/depth budgets, trust-class tainting, and advisory prompt-
 * injection heuristics. Untrusted content is never granted executable authority
 * (Invariant 13); over-budget content fails closed with a structured refusal.
 */
export function createQuarantineRoutes(services: AppServices) {
  const router = new Hono();

  const trustClassSchema = z.enum([
    'FIRST_PARTY',
    'USER_GENERATED',
    'THIRD_PARTY',
    'EXTERNAL',
    'SYSTEM_GENERATED',
    'UNKNOWN',
  ]);

  // POST /api/quarantine/inspect
  router.post(
    '/inspect',
    zValidator(
      'json',
      z.object({
        content: z.unknown(),
        trustClass: trustClassSchema.default('EXTERNAL'),
        source: z.string().default('agent.untrusted.input'),
        origin: z.string().default('https://external.untrusted'),
      }),
    ),
    async c => {
      const { content, trustClass, source, origin } = c.req.valid('json');
      const now = new Date();

      const envelope = ContentEnvelope.wrap(content, {
        source,
        origin,
        trustClass,
        retrievedAt: now,
        contentId: `cid_quarantine_${Date.now()}`,
      });

      const evaluation = services.quarantineEngine.evaluate(envelope);

      await services.auditRepo.append({
        eventId: `evt_${Date.now()}_quarantine`,
        timestamp: now,
        eventType: evaluation.allowed ? 'QUARANTINE_TRIGGERED' : 'QUARANTINE_VIOLATION',
        actor: { id: 'system', type: 'SYSTEM' },
        status: evaluation.allowed ? 'INFO' : 'FAILURE',
        reason: evaluation.refusalReason,
        provenance: envelope.provenance,
        metadata: {
          trustClass: evaluation.trustClass,
          taintFlags: evaluation.taintFlags,
          refusalCode: evaluation.refusalCode,
        },
      });

      return c.json({
        data: {
          envelope: {
            type: envelope.type,
            trustClass: envelope.trustClass,
            provenance: envelope.provenance,
            taintFlags: envelope.taintFlags,
          },
          evaluation,
        },
      });
    },
  );

  return router;
}
