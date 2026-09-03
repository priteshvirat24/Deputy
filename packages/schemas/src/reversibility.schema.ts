import { z } from 'zod';

export const reversibilityClassificationSchema = z.enum([
  'REVERSIBLE',
  'COMPENSATABLE',
  'IRREVERSIBLE',
]);

export const riskLevelSchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const undoActionDefinitionSchema = z.object({
  actionId: z.string().min(1),
  parameterMapping: z.record(z.string()),
});

export const compensationActionDefinitionSchema = z.object({
  actionId: z.string().min(1),
  description: z.string().min(1),
});

export const reversibilityMetadataSchema = z.object({
  classification: reversibilityClassificationSchema,
  undoAction: undoActionDefinitionSchema.optional(),
  compensationAction: compensationActionDefinitionSchema.optional(),
  sideEffects: z.array(z.string()),
  riskLevel: riskLevelSchema,
});
