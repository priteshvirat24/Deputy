import { z } from 'zod';
import { semanticActionSchema } from './semantic-action.schema.js';

export const demonstrationStatusSchema = z.enum(['RECORDING', 'COMPLETED', 'DISCARDED']);

export const applicationContextSchema = z.object({
  environment: z.string().min(1),
  appVersion: z.string().min(1),
  tenantId: z.string().optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
});

export const demonstrationSchema = z.object({
  demonstrationId: z.string().min(1),
  sessionId: z.string().min(1),
  actorId: z.string().min(1),
  startedAt: z.coerce.date(),
  completedAt: z.coerce.date().optional(),
  status: demonstrationStatusSchema,
  taskDescription: z.string().optional(),
  applicationContext: applicationContextSchema,
  actions: z.array(semanticActionSchema).default([]),
  metadata: z.record(z.unknown()).default({}),
});

export type DemonstrationSchemaType = z.infer<typeof demonstrationSchema>;
