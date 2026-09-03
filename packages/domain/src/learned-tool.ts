import { ProvenanceRecord } from './provenance.js';
import { ReversibilityClassification, RiskLevel } from './reversibility.js';

export type ToolLifecycleState =
  'DRAFT' | 'VALIDATING' | 'REGISTERED' | 'ACTIVE' | 'DISABLED' | 'RETIRED' | 'DELETED';

/**
 * Execution binding for a learned tool.
 * Strictly constrained to registered application actions.
 * No arbitrary scripts, no eval(), no DOM macros.
 */
export interface ApplicationActionBinding {
  type: 'APPLICATION_ACTION';
  actionId: string;
  actionVersion: number;
  parameterMapping?: Record<string, string>;
}

export type CompositeExecutionMode = 'ATOMIC' | 'COMPENSATABLE' | 'BEST_EFFORT';

/**
 * Explicit, declarative dataflow mapping connecting an upstream step's output
 * to a downstream step's parameter, eliminating naive conventional naming heuristics.
 */
export interface DataflowMapping {
  /** 0-indexed step order of the upstream step providing the output */
  sourceStepOrder: number;
  /** Property path inside step output, e.g. 'id', 'customer.id', or 'result.customerId' */
  sourcePath: string;
  /** Name of the parameter expected by this step's action */
  targetParam: string;
}

/**
 * Explicit compensation binding for reversible or compensatable steps.
 */
export interface CompensationBinding {
  compensationActionId: string;
  compensationActionVersion: number;
  parameterMapping: Record<string, string>;
}

export interface CompositeActionStep {
  actionId: string;
  actionVersion: number;
  stepOrder: number;
  /** Parameter mapping from top-level tool proposal arguments */
  parameterMapping: Record<string, string>;
  /** Explicit dataflow bindings from prior step outputs */
  dataflowMappings?: DataflowMapping[];
  /** Optional compensation handler executed if downstream steps fail */
  compensation?: CompensationBinding;
}

export interface CompositeActionBinding {
  type: 'COMPOSITE_ACTION';
  /**
   * Execution safety semantics:
   * - ATOMIC: Underlying actions participate in unified transaction.
   * - COMPENSATABLE: Failures trigger backward compensation actions.
   * - BEST_EFFORT: Executed sequentially; partial failure reported explicitly.
   */
  executionMode?: CompositeExecutionMode;
  actions: CompositeActionStep[];
}

export type ExecutionBinding = ApplicationActionBinding | CompositeActionBinding;

export interface ApprovalPolicy {
  /** If true, every execution must be accompanied by explicit human authorization */
  requiresHumanAuthorization: boolean;
  /** Required human roles for authorization */
  requiredRoles: string[];
  /** Maximum risk level the agent can execute without prompting for authorization */
  maxAutonomousRiskLevel: RiskLevel;
}

/**
 * Domain representation of a learned WebMCP tool.
 * Synthesized from demonstration traces, bound to trusted application actions.
 */
export interface LearnedTool {
  toolId: string;
  name: string;
  description: string;
  version: number;
  /** JSON Schema describing the arguments the tool accepts */
  inputSchema: Record<string, unknown>;
  /** Must resolve against trusted action registry */
  executionBinding: ExecutionBinding;
  /** IDs of demonstrations that synthesized this tool */
  sourceDemonstrations: string[];
  demonstrationCount: number;
  parameterProvenance: Record<string, ProvenanceRecord>;
  reversibility: ReversibilityClassification;
  riskLevel: RiskLevel;
  approvalPolicy: ApprovalPolicy;
  status: ToolLifecycleState;
  creator: {
    id: string;
    role: string;
  };
  createdAt: Date;
  updatedAt: Date;
  provenance: ProvenanceRecord;
  originRestrictions: string[];
}

export interface ToolVersionRecord {
  toolId: string;
  version: number;
  definition: LearnedTool;
  createdAt: Date;
  changelog?: string;
  deprecatedAt?: Date;
}

/**
 * Lifecycle state transition validation.
 * Ensures tools transition according to an auditable, strictly defined state machine.
 */
export const ALLOWED_LIFECYCLE_TRANSITIONS: Record<ToolLifecycleState, ToolLifecycleState[]> = {
  DRAFT: ['VALIDATING', 'DELETED'],
  VALIDATING: ['REGISTERED', 'DRAFT', 'DELETED'],
  REGISTERED: ['ACTIVE', 'DISABLED', 'RETIRED'],
  ACTIVE: ['DISABLED', 'RETIRED'],
  DISABLED: ['ACTIVE', 'RETIRED', 'DELETED'],
  RETIRED: ['DELETED'],
  DELETED: [],
};

export function isValidLifecycleTransition(
  current: ToolLifecycleState,
  target: ToolLifecycleState,
): boolean {
  const allowed = ALLOWED_LIFECYCLE_TRANSITIONS[current];
  return allowed ? allowed.includes(target) : false;
}
