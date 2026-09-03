import { z } from 'zod';
import { provenanceRecordSchema } from './provenance.schema.js';
import { reversibilityClassificationSchema, riskLevelSchema } from './reversibility.schema.js';

export const toolLifecycleStateSchema = z.enum([
  'DRAFT',
  'VALIDATING',
  'REGISTERED',
  'ACTIVE',
  'DISABLED',
  'RETIRED',
  'DELETED',
]);

/**
 * Enforces that execution bindings ONLY bind to registered application actions.
 * Explicitly forbids scripts, eval strings, shell commands, or arbitrary code.
 */
export const applicationActionBindingSchema = z.object({
  type: z.literal('APPLICATION_ACTION'),
  actionId: z.string().min(1, 'Target actionId is required'),
  actionVersion: z.number().int().positive(),
  parameterMapping: z.record(z.string()).optional(),
});

export const compositeExecutionModeSchema = z.enum(['ATOMIC', 'COMPENSATABLE', 'BEST_EFFORT']);

export const dataflowMappingSchema = z.object({
  sourceStepOrder: z.number().int().nonnegative(),
  sourcePath: z.string().min(1, 'Source path cannot be empty'),
  targetParam: z.string().min(1, 'Target parameter name is required'),
});

export const compensationBindingSchema = z.object({
  compensationActionId: z.string().min(1, 'Compensation action ID is required'),
  compensationActionVersion: z.number().int().positive(),
  parameterMapping: z.record(z.string()).default({}),
});

export const compositeActionStepSchema = z.object({
  actionId: z.string().min(1, 'Target actionId is required'),
  actionVersion: z.number().int().positive(),
  stepOrder: z.number().int().nonnegative(),
  parameterMapping: z.record(z.string()),
  dataflowMappings: z.array(dataflowMappingSchema).optional(),
  compensation: compensationBindingSchema.optional(),
});

export const compositeActionBindingSchema = z.object({
  type: z.literal('COMPOSITE_ACTION'),
  executionMode: compositeExecutionModeSchema.optional().default('COMPENSATABLE'),
  actions: z.array(compositeActionStepSchema).min(1, 'Composite action requires at least one step'),
});

export const executionBindingSchema = z.union([
  applicationActionBindingSchema,
  compositeActionBindingSchema,
]);

export const approvalPolicySchema = z.object({
  requiresHumanAuthorization: z.boolean(),
  requiredRoles: z.array(z.string()).default([]),
  maxAutonomousRiskLevel: riskLevelSchema,
});

export const learnedToolCreatorSchema = z.object({
  id: z.string().min(1),
  role: z.string().min(1),
});

export const learnedToolSchema = z.object({
  toolId: z.string().min(1, 'Tool ID is required'),
  name: z.string().min(1, 'Tool name is required'),
  description: z.string().min(1, 'Tool description is required'),
  version: z.number().int().positive(),
  inputSchema: z.record(z.unknown()),
  executionBinding: executionBindingSchema,
  sourceDemonstrations: z.array(z.string()),
  demonstrationCount: z.number().int().nonnegative(),
  parameterProvenance: z.record(provenanceRecordSchema).default({}),
  reversibility: reversibilityClassificationSchema,
  riskLevel: riskLevelSchema,
  approvalPolicy: approvalPolicySchema,
  status: toolLifecycleStateSchema,
  creator: learnedToolCreatorSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  provenance: provenanceRecordSchema,
  originRestrictions: z.array(z.string()).default([]),
});

export const toolVersionRecordSchema = z.object({
  toolId: z.string().min(1),
  version: z.number().int().positive(),
  definition: learnedToolSchema,
  createdAt: z.coerce.date(),
  changelog: z.string().optional(),
  deprecatedAt: z.coerce.date().optional(),
});

export type LearnedToolSchemaType = z.infer<typeof learnedToolSchema>;
export type ToolVersionRecordSchemaType = z.infer<typeof toolVersionRecordSchema>;
