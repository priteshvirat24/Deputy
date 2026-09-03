import { z } from 'zod';

export const webauthnRegisterOptionsRequestSchema = z.object({
  actorId: z.string().min(1),
  userName: z.string().min(1),
  userDisplayName: z.string().min(1),
});

export const webauthnRegisterVerifyRequestSchema = z.object({
  actorId: z.string().min(1),
  response: z.record(z.unknown()),
  challenge: z.string().min(1),
});

export const webauthnChallengeRequestSchema = z.object({
  toolId: z.string().min(1),
  toolVersion: z.number().int().positive(),
  arguments: z.record(z.unknown()),
  requestId: z.string().min(1),
  actorId: z.string().min(1),
});

export const webauthnVerifyAuthorizationRequestSchema = z.object({
  authorizationId: z.string().min(1),
  response: z.record(z.unknown()),
  credentialId: z.string().min(1),
});
