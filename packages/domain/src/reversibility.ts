/**
 * First-class reversibility classification and metadata.
 * Every action and tool must explicitly declare whether it can be undone,
 * compensated, or is irreversible.
 */

export type ReversibilityClassification = 'REVERSIBLE' | 'COMPENSATABLE' | 'IRREVERSIBLE';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface UndoActionDefinition {
  /** Target application action ID that reverses the effect */
  actionId: string;
  /** Mapping of original parameters to reverse parameters */
  parameterMapping: Record<string, string>;
}

export interface CompensationActionDefinition {
  /** Target application action ID that compensates for the effect */
  actionId: string;
  /** Human-readable explanation of compensation procedure */
  description: string;
}

export interface ReversibilityMetadata {
  /** Strict classification */
  classification: ReversibilityClassification;
  /** Undo action if strictly REVERSIBLE */
  undoAction?: UndoActionDefinition;
  /** Compensation action if COMPENSATABLE */
  compensationAction?: CompensationActionDefinition;
  /** Known real-world or database side-effects */
  sideEffects: string[];
  /** Inherent risk level associated with execution */
  riskLevel: RiskLevel;
}
