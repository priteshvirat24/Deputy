/**
 * Model representing an agent's proposal to execute a tool.
 * Distinct from tool definition and distinct from authorization.
 */
export interface ProposedBy {
  agentId: string;
  origin: string;
  sessionToken?: string;
}

export interface ToolProposal {
  /** Unique proposal ID */
  proposalId: string;
  /** ID of the tool proposed for invocation */
  toolId: string;
  /** Exact version of the tool */
  toolVersion: number;
  /** Parameters proposed for invocation */
  arguments: Record<string, unknown>;
  /** Client or agent request correlation ID */
  requestId: string;
  /** Identity and origin of the proposing agent */
  proposedBy: ProposedBy;
  /** Timestamp when proposal was received */
  timestamp: Date;
  /** Contextual execution hints (e.g. conversational goal, trace) */
  context?: Record<string, unknown>;
}
