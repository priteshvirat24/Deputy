import { Authorization } from './authorization.js';
import { LearnedTool } from './learned-tool.js';
import { ReversibilityClassification, RiskLevel } from './reversibility.js';
import { ToolProposal } from './tool-proposal.js';

export type PolicyDecisionType = 'ALLOW' | 'DENY' | 'REQUIRE_HUMAN_AUTHORIZATION';

export interface SecurityContext {
  origin: string;
  ipAddress?: string;
  authorization?: Authorization;
  humanActor?: {
    id: string;
    role: string;
  };
}

export interface PolicyDecision {
  decision: PolicyDecisionType;
  reason: string;
  policyRule: string;
  evaluatedAt: Date;
  requiredAuthorization?: {
    riskLevel: RiskLevel;
    reversibility: ReversibilityClassification;
    requiredRoles: string[];
  };
}

/**
 * Interface contract for the DEPUTY Policy Engine.
 */
export interface IPolicyEngine {
  evaluate(
    proposal: ToolProposal,
    tool: LearnedTool,
    context: SecurityContext,
  ): Promise<PolicyDecision>;
}
