import { z } from 'zod';
import { authorizationSchema } from './authorization.schema.js';
import { reversibilityClassificationSchema, riskLevelSchema } from './reversibility.schema.js';

export const policyDecisionTypeSchema = z.enum(['ALLOW', 'DENY', 'REQUIRE_HUMAN_AUTHORIZATION']);

export const securityContextSchema = z.object({
  origin: z.string().min(1),
  ipAddress: z.string().optional(),
  authorization: authorizationSchema.optional(),
  humanActor: z
    .object({
      id: z.string().min(1),
      role: z.string().min(1),
    })
    .optional(),
});

export const policyDecisionSchema = z.object({
  decision: policyDecisionTypeSchema,
  reason: z.string().min(1),
  policyRule: z.string().min(1),
  evaluatedAt: z.coerce.date(),
  requiredAuthorization: z
    .object({
      riskLevel: riskLevelSchema,
      reversibility: reversibilityClassificationSchema,
      requiredRoles: z.array(z.string()),
    })
    .optional(),
});

export type PolicyDecisionSchemaType = z.infer<typeof policyDecisionSchema>;
