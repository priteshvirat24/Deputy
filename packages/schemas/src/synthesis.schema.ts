import { z } from 'zod';
import { learnedToolSchema } from './learned-tool.schema.js';

export const parameterCategorySchema = z.enum([
  'USER_INPUT',
  'SYSTEM_GENERATED',
  'DERIVED',
  'IDENTIFIER',
  'VOLATILE_METADATA',
  'STABLE_CONSTANT',
  'UNKNOWN',
]);

export const parameterCandidateSchema = z.object({
  parameterName: z.string().min(1),
  sourceAction: z.string().min(1),
  sourceArgumentPath: z.string().min(1),
  observedValues: z.array(z.unknown()),
  inferredType: z.enum(['string', 'number', 'integer', 'boolean', 'array', 'object', 'null']),
  category: parameterCategorySchema,
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1),
  isOptional: z.boolean().optional(),
  enumValues: z.array(z.unknown()).optional(),
});

export const alignedActionStepSchema = z.object({
  stepOrder: z.number().int().nonnegative(),
  actionType: z.string().min(1),
  actionVersion: z.number().int().positive(),
  stableArguments: z.record(z.unknown()),
  variableArguments: z.record(z.array(z.unknown())),
  optionalInDemonstrations: z.array(z.string()).optional(),
});

export const alignedDemonstrationsSchema = z.object({
  demonstrationIds: z.array(z.string()).min(2),
  alignedSteps: z.array(alignedActionStepSchema),
  alignmentScore: z.number().min(0).max(1),
  divergences: z.array(z.string()),
});

export const synthesisConfidenceSchema = z.enum(['HIGH', 'MEDIUM', 'LOW', 'INSUFFICIENT_EVIDENCE']);

export const synthesisReportSchema = z.object({
  taskSummary: z.string().min(1),
  demonstrationCount: z.number().int().positive(),
  sourceDemonstrationIds: z.array(z.string()),
  alignedActionCount: z.number().int().nonnegative(),
  inferredParameters: z.array(parameterCandidateSchema),
  stableConstants: z.record(z.unknown()),
  ignoredVolatileFields: z.array(z.string()),
  confidence: synthesisConfidenceSchema,
  confidenceScore: z.number().min(0).max(1),
  reasoning: z.array(z.string()),
  synthesizedAt: z.coerce.date(),
});

export const synthesisCandidateResultSchema = z.object({
  candidateTool: learnedToolSchema,
  report: synthesisReportSchema,
});

export const recordingSessionStateSchema = z.enum([
  'IDLE',
  'RECORDING',
  'PAUSED',
  'COMPLETING',
  'COMPLETED',
  'DISCARDED',
  'FAILED',
]);

export const recordingSessionSchema = z.object({
  sessionId: z.string().min(1),
  demonstrationId: z.string().min(1),
  actorId: z.string().min(1),
  state: recordingSessionStateSchema,
  startedAt: z.coerce.date(),
  pausedAt: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional(),
  actionCount: z.number().int().nonnegative(),
  lastSequenceNumber: z.number().int().nonnegative(),
  metadata: z.record(z.unknown()).default({}),
});

export const compareDemonstrationsRequestSchema = z.object({
  demonstrationIds: z
    .array(z.string())
    .min(2, 'At least 2 demonstrations are required for alignment'),
});

export const synthesizeToolRequestSchema = z.object({
  demonstrationIds: z
    .array(z.string())
    .min(2, 'At least 2 demonstrations are required for tool synthesis'),
  toolNameOverride: z.string().optional(),
  descriptionOverride: z.string().optional(),
});

export const approveCandidateRequestSchema = z.object({
  toolId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  inputSchema: z.record(z.unknown()),
});
