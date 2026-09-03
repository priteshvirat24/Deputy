import { ReversibilityClassification, RiskLevel } from './reversibility.js';

export interface ActionExecutionContext {
  correlationId: string;
  actorId: string;
  sessionId?: string;
  requestId?: string;
  timestamp: Date;
}

/**
 * A trusted application function handler.
 * Executed in a verified environment, never via eval() or string generation.
 */
export type TrustedActionHandler<
  TInput extends Record<string, unknown> = Record<string, unknown>,
  TOutput = unknown,
> = (args: TInput, context: ActionExecutionContext) => Promise<TOutput>;

/**
 * Definition of an application action registered in the system.
 */
export interface RegisteredApplicationAction<
  TInput extends Record<string, unknown> = Record<string, unknown>,
  TOutput = unknown,
> {
  /** Unique action identifier (e.g., 'refund.create', 'customer.update') */
  id: string;
  /** Schema version */
  version: number;
  /** Human-readable name */
  name: string;
  /** Clear semantic description */
  description: string;
  /** JSON schema or Zod schema definition for input arguments */
  inputSchema: Record<string, unknown>;
  /** The trusted application handler */
  handler: TrustedActionHandler<TInput, TOutput>;
  /** Reversibility categorization */
  reversibility: ReversibilityClassification;
  /** Risk classification */
  riskLevel: RiskLevel;
  /** Known side-effects */
  sideEffects: string[];
  /** Required permissions / roles to invoke */
  requiredPermissions: string[];
}

/**
 * Interface for the trusted action registry.
 */
export interface IActionRegistry {
  register<TInput extends Record<string, unknown>, TOutput>(
    action: RegisteredApplicationAction<TInput, TOutput>,
  ): void;
  get(id: string, version?: number): RegisteredApplicationAction | undefined;
  has(id: string, version?: number): boolean;
  list(): RegisteredApplicationAction[];
}
