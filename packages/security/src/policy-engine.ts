import {
  IPolicyEngine,
  LearnedTool,
  PolicyDecision,
  SecurityContext,
  ToolProposal,
} from '@deputy/domain';
import { AuthorizationVerifier } from './authorization-verifier.js';

export class PolicyEngine implements IPolicyEngine {
  constructor(private verifier: AuthorizationVerifier = new AuthorizationVerifier()) {}

  /**
   * Evaluate a proposed tool execution against DEPUTY security policies.
   * Fails closed by default (Invariant 8).
   */
  public async evaluate(
    proposal: ToolProposal,
    tool: LearnedTool,
    context: SecurityContext,
  ): Promise<PolicyDecision> {
    const evaluatedAt = new Date();

    // 1. Tool Lifecycle Rule: Only ACTIVE tools may execute
    if (tool.status !== 'ACTIVE') {
      return {
        decision: 'DENY',
        reason: `Tool '${tool.toolId}' is in '${tool.status}' state. Only ACTIVE tools may be executed.`,
        policyRule: 'LIFECYCLE_STATE_MUST_BE_ACTIVE',
        evaluatedAt,
      };
    }

    // 2. Origin Restrictions Rule
    if (
      tool.originRestrictions &&
      tool.originRestrictions.length > 0 &&
      !tool.originRestrictions.includes(context.origin)
    ) {
      return {
        decision: 'DENY',
        reason: `Origin '${context.origin}' is not authorized for tool '${tool.toolId}'. Allowed: [${tool.originRestrictions.join(', ')}]`,
        policyRule: 'CROSS_ORIGIN_RESTRICTION',
        evaluatedAt,
      };
    }

    // 3. Determine if human authorization is required
    const requiresHuman =
      tool.approvalPolicy.requiresHumanAuthorization ||
      tool.riskLevel === 'HIGH' ||
      tool.riskLevel === 'CRITICAL' ||
      tool.reversibility === 'IRREVERSIBLE';

    if (requiresHuman) {
      // Invariant 3 & 4: Check if valid authorization is already present in context
      if (context.authorization) {
        const verification = this.verifier.verify(context.authorization, proposal);
        if (verification.valid) {
          return {
            decision: 'ALLOW',
            reason: `Execution authorized by actor '${context.authorization.actor.id}' via cryptographic binding.`,
            policyRule: 'CRYPTOGRAPHIC_AUTHORIZATION_VERIFIED',
            evaluatedAt,
          };
        } else {
          return {
            decision: 'DENY',
            reason: `Provided authorization was rejected: ${verification.reason}`,
            policyRule: 'INVALID_AUTHORIZATION_FAILED_CLOSED',
            evaluatedAt,
          };
        }
      }

      // No authorization provided yet
      return {
        decision: 'REQUIRE_HUMAN_AUTHORIZATION',
        reason: `Operation involves risk level '${tool.riskLevel}' and reversibility '${tool.reversibility}', requiring human authorization.`,
        policyRule: 'RISK_AND_REVERSIBILITY_AUTHORIZATION_GATE',
        evaluatedAt,
        requiredAuthorization: {
          riskLevel: tool.riskLevel,
          reversibility: tool.reversibility,
          requiredRoles: tool.approvalPolicy.requiredRoles,
        },
      };
    }

    // Low/Medium risk, reversible/compensatable action allowed autonomously
    return {
      decision: 'ALLOW',
      reason: `Tool '${tool.toolId}' is within autonomous risk threshold.`,
      policyRule: 'AUTONOMOUS_POLICY_PERMITTED',
      evaluatedAt,
    };
  }
}
