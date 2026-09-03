import { Authorization } from './authorization.js';
import { LearnedTool } from './learned-tool.js';
import { ToolProposal } from './tool-proposal.js';

export type ExecutionOutcome =
  'SUCCESS' | 'NO_EFFECT' | 'PARTIAL_EFFECT' | 'COMPENSATED' | 'COMPENSATION_FAILED';

export interface StepExecutionRecord {
  stepOrder: number;
  actionId: string;
  actionVersion: number;
  inputDigest: string;
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
  status: 'SUCCESS' | 'FAILURE' | 'SKIPPED';
  output?: unknown;
  error?: string;
  compensationStatus: 'NONE' | 'NOT_REQUIRED' | 'PENDING' | 'COMPENSATED' | 'COMPENSATION_FAILED';
  correlationId: string;
}

export interface ToolExecutionResult {
  executionId: string;
  toolId: string;
  toolVersion: number;
  success: boolean;
  outcome: ExecutionOutcome;
  output?: unknown;
  stepRecords?: StepExecutionRecord[];
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  executedAt: Date;
  durationMs: number;
}

/**
 * Contract for the Tool Execution Boundary.
 * Enforces that execution only occurs via trusted registered actions,
 * never through code evaluation or DOM automation.
 */
export interface IToolExecutor {
  execute(
    proposal: ToolProposal,
    tool: LearnedTool,
    authorization?: Authorization,
  ): Promise<ToolExecutionResult>;
}
