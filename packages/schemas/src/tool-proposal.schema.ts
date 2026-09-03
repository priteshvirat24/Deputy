import { z } from 'zod';

export const proposedBySchema = z.object({
  agentId: z.string().min(1, 'Agent identifier is required'),
  origin: z.string().min(1, 'Agent origin is required'),
  sessionToken: z.string().optional(),
});

export const toolProposalSchema = z.object({
  proposalId: z.string().min(1, 'Proposal ID is required'),
  toolId: z.string().min(1, 'Tool ID is required'),
  toolVersion: z.number().int().positive(),
  arguments: z.record(z.unknown()),
  requestId: z.string().min(1, 'Request correlation ID is required'),
  proposedBy: proposedBySchema,
  timestamp: z.coerce.date(),
  context: z.record(z.unknown()).optional(),
});

export type ToolProposalSchemaType = z.infer<typeof toolProposalSchema>;
