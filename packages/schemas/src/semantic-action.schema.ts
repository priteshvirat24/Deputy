import { z } from 'zod';
import { provenanceRecordSchema } from './provenance.schema.js';
import { reversibilityClassificationSchema } from './reversibility.schema.js';

export const semanticActionActorSchema = z.object({
  id: z.string().min(1),
  role: z.string().min(1),
  type: z.enum(['HUMAN', 'AGENT', 'SYSTEM']),
});

export const semanticActionResultSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .optional(),
});

export const semanticActionSchema = z.object({
  actionId: z.string().min(1),
  actionType: z.string().min(1),
  actionVersion: z.number().int().positive(),
  arguments: z.record(z.unknown()),
  actor: semanticActionActorSchema,
  timestamp: z.coerce.date(),
  demonstrationId: z.string().optional(),
  sessionId: z.string().min(1),
  result: semanticActionResultSchema.optional(),
  sideEffects: z.array(z.string()).default([]),
  reversibility: reversibilityClassificationSchema,
  provenance: provenanceRecordSchema,
  correlationId: z.string().min(1),
  uiContext: z
    .object({
      componentName: z.string().optional(),
      viewRoute: z.string().optional(),
    })
    .optional(),
});

export type SemanticActionSchemaType = z.infer<typeof semanticActionSchema>;
