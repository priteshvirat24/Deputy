import { ProvenanceRecord } from './provenance.js';
import { ReversibilityClassification } from './reversibility.js';

export interface SemanticActionActor {
  id: string;
  role: string;
  type: 'HUMAN' | 'AGENT' | 'SYSTEM';
}

export interface SemanticActionResult {
  success: boolean;
  data?: unknown;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Strongly typed representation of an application-level semantic action.
 * Represents intentional domain actions (e.g. `create_refund`, `update_customer`),
 * never low-level DOM click or keyboard events.
 */
export interface SemanticAction {
  /** Unique ID for this action instance */
  actionId: string;
  /** Domain action type identifier (e.g. 'create_refund', 'archive_record') */
  actionType: string;
  /** Semantic version of the action interface */
  actionVersion: number;
  /** Structured, typed arguments */
  arguments: Record<string, unknown>;
  /** Entity performing or triggering the action */
  actor: SemanticActionActor;
  /** Timestamp when the action was observed */
  timestamp: Date;
  /** Optional reference to the enclosing demonstration */
  demonstrationId?: string;
  /** Session correlation identifier */
  sessionId: string;
  /** Outcome of action execution if completed */
  result?: SemanticActionResult;
  /** List of observed side-effects */
  sideEffects: string[];
  /** Reversibility declaration */
  reversibility: ReversibilityClassification;
  /** Provenance metadata */
  provenance: ProvenanceRecord;
  /** Request correlation ID */
  correlationId: string;
  /** Optional secondary UI debugging metadata (never canonical execution binding) */
  uiContext?: {
    componentName?: string;
    viewRoute?: string;
  };
}
