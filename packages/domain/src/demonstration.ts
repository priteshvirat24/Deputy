import { SemanticAction } from './semantic-action.js';

export type DemonstrationStatus = 'RECORDING' | 'COMPLETED' | 'DISCARDED';

export interface ApplicationContext {
  environment: string;
  appVersion: string;
  tenantId?: string;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Domain model representing a human demonstration.
 * The demonstration is the empirical evidence from which a learned capability
 * is synthesized. A demonstration is NOT itself a tool.
 */
export interface Demonstration {
  demonstrationId: string;
  sessionId: string;
  actorId: string;
  startedAt: Date;
  completedAt?: Date;
  status: DemonstrationStatus;
  taskDescription?: string;
  applicationContext: ApplicationContext;
  /** Ordered list of observed semantic actions */
  actions: SemanticAction[];
  metadata: Record<string, unknown>;
}
