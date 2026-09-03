import { z } from 'zod';
import { auditEventTypeSchema } from './audit.schema.js';
import { authorizationSchema } from './authorization.schema.js';
import { learnedToolSchema, toolLifecycleStateSchema } from './learned-tool.schema.js';
import { toolProposalSchema } from './tool-proposal.schema.js';

export const createToolRequestSchema = learnedToolSchema;

export const updateToolStatusSchema = z.object({
  status: toolLifecycleStateSchema,
  reason: z.string().min(1, 'Reason for status update is required'),
});

export const submitProposalRequestSchema = toolProposalSchema;

export const createAuthorizationRequestSchema = authorizationSchema;

export const auditFilterSchema = z.object({
  toolId: z.string().optional(),
  eventType: auditEventTypeSchema.optional(),
  actorId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
    requestId: z.string().optional(),
  }),
});
