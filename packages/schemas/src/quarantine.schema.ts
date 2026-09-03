import { z } from 'zod';
import { provenanceRecordSchema, trustClassSchema } from './provenance.schema.js';

export const quarantinedContentTypeSchema = z.enum(['text', 'json', 'reference']);

export const quarantinedContentPartSchema = z.object({
  type: quarantinedContentTypeSchema,
  value: z.unknown(),
  provenance: provenanceRecordSchema,
  trustClass: trustClassSchema,
  taintFlags: z.array(z.string()).default([]),
});

export const responseBudgetSchema = z.object({
  maxBytes: z.number().int().positive(),
  maxCharacters: z.number().int().positive(),
  maxItems: z.number().int().positive(),
  maxDepth: z.number().int().positive(),
});

export const quarantineEvaluationResultSchema = z.object({
  allowed: z.boolean(),
  trustClass: trustClassSchema,
  taintFlags: z.array(z.string()),
  refusalCode: z.string().optional(),
  refusalReason: z.string().optional(),
  details: z.record(z.unknown()).optional(),
});
