import { z } from 'zod';

export const trustClassSchema = z.enum([
  'FIRST_PARTY',
  'USER_GENERATED',
  'THIRD_PARTY',
  'EXTERNAL',
  'SYSTEM_GENERATED',
  'UNKNOWN',
]);

export const provenanceRecordSchema = z.object({
  source: z.string().min(1, 'Source identifier is required'),
  origin: z.string().min(1, 'Origin URL or system identifier is required'),
  trustClass: trustClassSchema,
  retrievedAt: z.coerce.date(),
  contentId: z.string().min(1, 'Deterministic content ID is required'),
  taintFlags: z.array(z.string()).optional(),
});

export type ProvenanceRecordSchemaType = z.infer<typeof provenanceRecordSchema>;
