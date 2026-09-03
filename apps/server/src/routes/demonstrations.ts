import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { Demonstration, DemonstrationStatus, SemanticAction } from '@deputy/domain';
import { demonstrationSchema, semanticActionSchema } from '@deputy/schemas';
import { RecordingStateMachine } from '@deputy/synthesis';
import { AppServices } from '../services/index.js';

export function createDemonstrationRoutes(services: AppServices) {
  const router = new Hono();

  // GET /api/demonstrations
  router.get('/', async c => {
    const actorId = c.req.query('actorId');
    const status = c.req.query('status') as DemonstrationStatus | undefined;

    const demos = await services.demonstrationRepo.list({ actorId, status });
    return c.json({ data: demos });
  });

  // GET /api/demonstrations/:id
  router.get('/:id', async c => {
    const id = c.req.param('id');
    const demo = await services.demonstrationRepo.getById(id);

    if (!demo) {
      return c.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: `Demonstration with ID '${id}' was not found.`,
          },
        },
        404,
      );
    }

    return c.json({ data: demo });
  });

  // POST /api/demonstrations
  router.post('/', zValidator('json', demonstrationSchema), async c => {
    const demoData = c.req.valid('json');
    const created = await services.demonstrationRepo.create(demoData);

    await services.auditRepo.append({
      eventId: `evt_${Date.now()}_demo_start`,
      timestamp: new Date(),
      eventType: 'DEMONSTRATION_STARTED',
      actor: { id: created.actorId, type: 'USER' },
      sessionId: created.sessionId,
      status: 'SUCCESS',
      metadata: { demonstrationId: created.demonstrationId },
    });

    return c.json({ data: created }, 201);
  });

  // POST /api/demonstrations/recording/start
  router.post(
    '/recording/start',
    zValidator(
      'json',
      z.object({
        taskDescription: z.string().min(1),
        actorId: z.string().default('user_operator_1'),
      }),
    ),
    async c => {
      const { taskDescription, actorId } = c.req.valid('json');
      const now = new Date();
      const demonstrationId = `demo_${Date.now()}`;
      const sessionId = `sess_${Date.now()}`;

      const demo: Demonstration = {
        demonstrationId,
        actorId,
        sessionId,
        taskDescription,
        status: 'RECORDING',
        applicationContext: {
          environment: 'operations_console',
          appVersion: '2.0.0',
        },
        actions: [],
        startedAt: now,
        metadata: {
          provenance: {
            source: 'ui.console.recorder',
            origin: 'http://localhost:5173',
            trustClass: 'FIRST_PARTY',
            retrievedAt: now,
            contentId: `cid_${demonstrationId}`,
          },
        },
      };

      const created = await services.demonstrationRepo.create(demo);

      const stateMachine = new RecordingStateMachine({
        sessionId,
        demonstrationId,
        actorId,
        state: 'RECORDING',
        startedAt: now,
        actionCount: 0,
        lastSequenceNumber: 0,
        metadata: { taskDescription },
      });

      services.activeRecordingSessions.set(demonstrationId, stateMachine);

      await services.auditRepo.append({
        eventId: `evt_${Date.now()}_demo_started`,
        timestamp: now,
        eventType: 'DEMONSTRATION_STARTED',
        actor: { id: actorId, type: 'USER' },
        sessionId,
        status: 'SUCCESS',
        metadata: { demonstrationId, taskDescription },
      });

      return c.json(
        {
          data: {
            demonstration: created,
            session: stateMachine.getSession(),
          },
        },
        201,
      );
    },
  );

  // POST /api/demonstrations/:id/recording/action
  router.post(
    '/:id/recording/action',
    zValidator(
      'json',
      z.object({
        action: semanticActionSchema,
        sequenceNumber: z.number().int().positive(),
      }),
    ),
    async c => {
      const demonstrationId = c.req.param('id');
      const { action, sequenceNumber } = c.req.valid('json');

      const machine = services.activeRecordingSessions.get(demonstrationId);
      if (!machine) {
        return c.json(
          {
            error: {
              code: 'SESSION_NOT_FOUND',
              message: `No active recording session for '${demonstrationId}'`,
            },
          },
          404,
        );
      }

      try {
        const { session, action: recordedAction } = machine.ingestAction({
          action,
          sequenceNumber,
        });
        await services.demonstrationRepo.addActions(demonstrationId, [recordedAction]);

        await services.auditRepo.append({
          eventId: `evt_${Date.now()}_act_${action.actionId}`,
          timestamp: new Date(),
          eventType: 'ACTION_OBSERVED',
          actor: { id: action.actor.id, type: 'USER' },
          sessionId: session.sessionId,
          status: 'SUCCESS',
          metadata: { demonstrationId, actionType: action.actionType, sequenceNumber },
        });

        return c.json({ data: { session, action: recordedAction } });
      } catch (err: unknown) {
        return c.json(
          {
            error: {
              code: 'INGESTION_ERROR',
              message: err instanceof Error ? err.message : String(err),
            },
          },
          400,
        );
      }
    },
  );

  // POST /api/demonstrations/:id/recording/pause
  router.post('/:id/recording/pause', async c => {
    const demonstrationId = c.req.param('id');
    const machine = services.activeRecordingSessions.get(demonstrationId);
    if (!machine) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Recording session not found' } }, 404);
    }

    try {
      const session = machine.transition('PAUSED');
      await services.demonstrationRepo.updateStatus(demonstrationId, 'RECORDING');
      return c.json({ data: session });
    } catch (err: unknown) {
      return c.json(
        {
          error: {
            code: 'TRANSITION_ERROR',
            message: err instanceof Error ? err.message : String(err),
          },
        },
        400,
      );
    }
  });

  // POST /api/demonstrations/:id/recording/resume
  router.post('/:id/recording/resume', async c => {
    const demonstrationId = c.req.param('id');
    const machine = services.activeRecordingSessions.get(demonstrationId);
    if (!machine) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Recording session not found' } }, 404);
    }

    try {
      const session = machine.transition('RECORDING');
      return c.json({ data: session });
    } catch (err: unknown) {
      return c.json(
        {
          error: {
            code: 'TRANSITION_ERROR',
            message: err instanceof Error ? err.message : String(err),
          },
        },
        400,
      );
    }
  });

  // POST /api/demonstrations/:id/recording/complete
  router.post('/:id/recording/complete', async c => {
    const demonstrationId = c.req.param('id');
    const machine = services.activeRecordingSessions.get(demonstrationId);
    if (!machine) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Recording session not found' } }, 404);
    }

    try {
      machine.transition('COMPLETING');
      const session = machine.transition('COMPLETED');
      const updated = await services.demonstrationRepo.updateStatus(demonstrationId, 'COMPLETED');
      services.activeRecordingSessions.delete(demonstrationId);

      await services.auditRepo.append({
        eventId: `evt_${Date.now()}_demo_completed`,
        timestamp: new Date(),
        eventType: 'DEMONSTRATION_COMPLETED',
        actor: { id: updated.actorId, type: 'USER' },
        sessionId: updated.sessionId,
        status: 'SUCCESS',
        metadata: { demonstrationId, totalActions: updated.actions.length },
      });

      return c.json({ data: { demonstration: updated, session } });
    } catch (err: unknown) {
      return c.json(
        {
          error: {
            code: 'TRANSITION_ERROR',
            message: err instanceof Error ? err.message : String(err),
          },
        },
        400,
      );
    }
  });

  // POST /api/demonstrations/:id/recording/discard
  router.post('/:id/recording/discard', async c => {
    const demonstrationId = c.req.param('id');
    const machine = services.activeRecordingSessions.get(demonstrationId);
    if (!machine) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Recording session not found' } }, 404);
    }

    try {
      const session = machine.transition('DISCARDED');
      await services.demonstrationRepo.updateStatus(demonstrationId, 'DISCARDED');
      services.activeRecordingSessions.delete(demonstrationId);
      return c.json({ data: session });
    } catch (err: unknown) {
      return c.json(
        {
          error: {
            code: 'TRANSITION_ERROR',
            message: err instanceof Error ? err.message : String(err),
          },
        },
        400,
      );
    }
  });

  // POST /api/demonstrations/execute-action
  // Real enterprise Operations Console execution boundary:
  // UI interaction -> Application Command -> ActionRegistry -> Semantic Action -> Recorder
  router.post(
    '/execute-action',
    zValidator(
      'json',
      z.object({
        actionId: z.string().min(1),
        actionVersion: z.number().int().positive().default(1),
        arguments: z.record(z.unknown()),
        recordingDemonstrationId: z.string().optional(),
      }),
    ),
    async c => {
      const {
        actionId,
        actionVersion,
        arguments: args,
        recordingDemonstrationId,
      } = c.req.valid('json');

      const action = services.actionRegistry.get(actionId, actionVersion);
      if (!action) {
        return c.json(
          {
            error: {
              code: 'UNKNOWN_ACTION',
              message: `Action '${actionId}' v${actionVersion} is not in ActionRegistry.`,
            },
          },
          404,
        );
      }

      const correlationId = `corr_${Date.now()}`;
      const now = new Date();

      try {
        // Execute real handler in ActionRegistry
        const output = await action.handler(args, {
          correlationId,
          actorId: 'user_operator_1',
          requestId: `req_op_${Date.now()}`,
          timestamp: now,
        });

        let recordedAction: SemanticAction | undefined;

        // If recording active, intercept semantic action
        if (
          recordingDemonstrationId &&
          services.activeRecordingSessions.has(recordingDemonstrationId)
        ) {
          const machine = services.activeRecordingSessions.get(recordingDemonstrationId)!;
          const nextSeq = machine.getSession().lastSequenceNumber + 1;

          const semAction: SemanticAction = {
            actionId: `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            actionType: actionId,
            actionVersion,
            arguments: args,
            actor: { id: 'user_operator_1', type: 'HUMAN', role: 'operations_lead' },
            timestamp: now,
            sessionId: machine.getSession().sessionId,
            demonstrationId: recordingDemonstrationId,
            sideEffects: action.sideEffects,
            reversibility: action.reversibility,
            provenance: {
              source: 'operations.console',
              origin: 'http://localhost:5173',
              trustClass: 'FIRST_PARTY',
              retrievedAt: now,
              contentId: `cid_${correlationId}`,
            },
            correlationId,
          };

          const ingestResult = machine.ingestAction({ action: semAction, sequenceNumber: nextSeq });
          await services.demonstrationRepo.addActions(recordingDemonstrationId, [
            ingestResult.action,
          ]);
          recordedAction = ingestResult.action;
        }

        return c.json({
          data: {
            result: output,
            recordedAction,
          },
        });
      } catch (err: unknown) {
        return c.json(
          {
            error: {
              code: 'EXECUTION_FAILED',
              message: err instanceof Error ? err.message : String(err),
            },
          },
          500,
        );
      }
    },
  );

  return router;
}
