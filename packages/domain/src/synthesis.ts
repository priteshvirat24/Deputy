import { LearnedTool } from './learned-tool.js';

export type ParameterCategory =
  | 'USER_INPUT'
  | 'SYSTEM_GENERATED'
  | 'DERIVED'
  | 'IDENTIFIER'
  | 'VOLATILE_METADATA'
  | 'STABLE_CONSTANT'
  | 'UNKNOWN';

export interface ParameterCandidate {
  parameterName: string;
  sourceAction: string;
  sourceArgumentPath: string;
  observedValues: unknown[];
  inferredType: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'null';
  category: ParameterCategory;
  confidence: number;
  reason: string;
  isOptional?: boolean;
  enumValues?: unknown[];
}

export interface AlignedActionStep {
  stepOrder: number;
  actionType: string;
  actionVersion: number;
  stableArguments: Record<string, unknown>;
  variableArguments: Record<string, unknown[]>;
  optionalInDemonstrations?: string[];
}

export interface AlignedDemonstrations {
  demonstrationIds: string[];
  alignedSteps: AlignedActionStep[];
  alignmentScore: number;
  divergences: string[];
}

export type SynthesisConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_EVIDENCE';

export interface SynthesisReport {
  taskSummary: string;
  demonstrationCount: number;
  sourceDemonstrationIds: string[];
  alignedActionCount: number;
  inferredParameters: ParameterCandidate[];
  stableConstants: Record<string, unknown>;
  ignoredVolatileFields: string[];
  confidence: SynthesisConfidence;
  confidenceScore: number;
  reasoning: string[];
  synthesizedAt: Date;
}

export interface SynthesisCandidateResult {
  candidateTool: LearnedTool;
  report: SynthesisReport;
}

export type RecordingSessionState =
  'IDLE' | 'RECORDING' | 'PAUSED' | 'COMPLETING' | 'COMPLETED' | 'DISCARDED' | 'FAILED';

export interface RecordingSession {
  sessionId: string;
  demonstrationId: string;
  actorId: string;
  state: RecordingSessionState;
  startedAt: Date;
  pausedAt?: Date;
  completedAt?: Date;
  actionCount: number;
  lastSequenceNumber: number;
  metadata: Record<string, unknown>;
}

export const ALLOWED_RECORDING_TRANSITIONS: Record<RecordingSessionState, RecordingSessionState[]> =
  {
    IDLE: ['RECORDING', 'FAILED'],
    RECORDING: ['PAUSED', 'COMPLETING', 'DISCARDED', 'FAILED'],
    PAUSED: ['RECORDING', 'DISCARDED', 'FAILED'],
    COMPLETING: ['COMPLETED', 'FAILED'],
    COMPLETED: [],
    DISCARDED: [],
    FAILED: [],
  };

export function isValidRecordingTransition(
  current: RecordingSessionState,
  target: RecordingSessionState,
): boolean {
  const allowed = ALLOWED_RECORDING_TRANSITIONS[current];
  return allowed ? allowed.includes(target) : false;
}
