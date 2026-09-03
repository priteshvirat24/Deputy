import { QuarantineEvaluationResult, QuarantinedContentPart } from '@deputy/domain';
import { PromptInjectionHeuristics } from './heuristics.js';
import { ResponseBudgetEnforcer } from './response-budget.js';

export class QuarantinePolicyEngine {
  private budgetEnforcer: ResponseBudgetEnforcer;

  constructor(budgetEnforcer?: ResponseBudgetEnforcer) {
    this.budgetEnforcer = budgetEnforcer || new ResponseBudgetEnforcer();
  }

  /**
   * Evaluate a quarantined content envelope against security trust policies.
   */
  public evaluate(contentPart: QuarantinedContentPart): QuarantineEvaluationResult {
    // 1. Budget enforcement
    const budgetCheck = this.budgetEnforcer.evaluate(contentPart.value);
    if (!budgetCheck.withinBudget) {
      return {
        allowed: false,
        trustClass: contentPart.trustClass,
        taintFlags: [...contentPart.taintFlags, 'OVERSIZED_RESPONSE'],
        refusalCode: budgetCheck.refusalCode,
        refusalReason: budgetCheck.refusalReason,
        details: budgetCheck.stats,
      };
    }

    // 2. Trust Class Policy
    const taintFlags = [...contentPart.taintFlags];

    // Check advisory prompt injection heuristics
    const heuristicCheck = PromptInjectionHeuristics.inspectPayload(contentPart.value);
    if (heuristicCheck.detected) {
      taintFlags.push('SUSPICIOUS_INSTRUCTION_PATTERNS');
    }

    switch (contentPart.trustClass) {
      case 'FIRST_PARTY':
      case 'SYSTEM_GENERATED':
        return {
          allowed: true,
          trustClass: contentPart.trustClass,
          taintFlags,
        };

      case 'USER_GENERATED':
        taintFlags.push('UNTRUSTED_USER_CONTENT');
        return {
          allowed: true,
          trustClass: contentPart.trustClass,
          taintFlags,
        };

      case 'THIRD_PARTY':
      case 'EXTERNAL':
        taintFlags.push('UNTRUSTED_EXTERNAL_CONTENT');
        return {
          allowed: true,
          trustClass: contentPart.trustClass,
          taintFlags,
        };

      case 'UNKNOWN':
      default:
        return {
          allowed: false,
          trustClass: 'UNKNOWN',
          taintFlags: [...taintFlags, 'UNKNOWN_PROVENANCE'],
          refusalCode: 'PROVENANCE_BLOCKED',
          refusalReason: 'Content with unknown or unverified provenance is blocked by policy.',
        };
    }
  }

  /**
   * Assert that an untrusted content part cannot alter execution authority or register tools.
   */
  public assertCannotElevatePrivilege(contentPart: QuarantinedContentPart): void {
    if (contentPart.trustClass !== 'FIRST_PARTY' && contentPart.trustClass !== 'SYSTEM_GENERATED') {
      throw new Error(
        `Privilege elevation violation: Content with trust class '${contentPart.trustClass}' cannot grant execution authority or define tool bindings.`,
      );
    }
  }
}
