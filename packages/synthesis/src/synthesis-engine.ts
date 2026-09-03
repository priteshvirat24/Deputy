import { randomUUID } from 'node:crypto';
import {
  CompositeActionStep,
  Demonstration,
  ExecutionBinding,
  IActionRegistry,
  LearnedTool,
  ReversibilityClassification,
  RiskLevel,
  SynthesisCandidateResult,
  SynthesisConfidence,
  SynthesisReport,
} from '@deputy/domain';
import { AlignmentEngine } from './alignment-engine.js';
import { ParameterInferenceEngine } from './parameter-inference.js';
import { SchemaGenerator } from './schema-generator.js';

export interface SynthesisOptions {
  toolNameOverride?: string;
  descriptionOverride?: string;
  creatorId?: string;
  creatorRole?: string;
}

const RISK_HIERARCHY: Record<RiskLevel, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

const REVERSIBILITY_HIERARCHY: Record<ReversibilityClassification, number> = {
  REVERSIBLE: 1,
  COMPENSATABLE: 2,
  IRREVERSIBLE: 3,
};

export class ToolSynthesisEngine {
  private alignmentEngine: AlignmentEngine;
  private parameterEngine: ParameterInferenceEngine;
  private schemaGenerator: SchemaGenerator;

  constructor() {
    this.alignmentEngine = new AlignmentEngine();
    this.parameterEngine = new ParameterInferenceEngine();
    this.schemaGenerator = new SchemaGenerator();
  }

  /**
   * Synthesize a typed LearnedTool candidate from 2 or more demonstrations.
   * Completely deterministic, evidence-preserving, and fail-closed.
   */
  public synthesize(
    demonstrations: Demonstration[],
    actionRegistry: IActionRegistry,
    options?: SynthesisOptions,
  ): SynthesisCandidateResult {
    // 1. Evidence sufficiency check
    if (!demonstrations || demonstrations.length < 2) {
      throw new Error(
        'INSUFFICIENT_EVIDENCE: Tool synthesis requires at least 2 completed demonstrations to infer variable parameters.',
      );
    }

    // 2. Align demonstrations
    const aligned = this.alignmentEngine.align(demonstrations);

    // 3. Verify that all observed action types exist in the trusted ActionRegistry
    for (const step of aligned.alignedSteps) {
      if (!actionRegistry.has(step.actionType, step.actionVersion)) {
        throw new Error(
          `UNREGISTERED_ACTION_TARGET: Aligned action '${step.actionType}' (v${step.actionVersion}) is not registered in the ActionRegistry.`,
        );
      }
    }

    // 4. Infer parameter candidates
    const parameterCandidates = this.parameterEngine.infer(aligned, actionRegistry);

    // 5. Generate JSON Schema
    const inputSchema = this.schemaGenerator.generate(parameterCandidates);

    // 6. Aggregate risk and reversibility conservatively
    let highestRisk: RiskLevel = 'LOW';
    let highestReversibility: ReversibilityClassification = 'REVERSIBLE';

    for (const step of aligned.alignedSteps) {
      const regAction = actionRegistry.get(step.actionType, step.actionVersion)!;

      if (RISK_HIERARCHY[regAction.riskLevel] > RISK_HIERARCHY[highestRisk]) {
        highestRisk = regAction.riskLevel;
      }

      if (
        REVERSIBILITY_HIERARCHY[regAction.reversibility] >
        REVERSIBILITY_HIERARCHY[highestReversibility]
      ) {
        highestReversibility = regAction.reversibility;
      }
    }

    // 7. Compose execution binding
    let executionBinding: ExecutionBinding;
    const isMultiAction = aligned.alignedSteps.length > 1;

    if (!isMultiAction) {
      const singleStep = aligned.alignedSteps[0]!;
      const mapping: Record<string, string> = {};
      for (const param of parameterCandidates) {
        if (param.sourceAction === singleStep.actionType) {
          mapping[param.parameterName] = param.sourceArgumentPath;
        }
      }

      executionBinding = {
        type: 'APPLICATION_ACTION',
        actionId: singleStep.actionType,
        actionVersion: singleStep.actionVersion,
        parameterMapping: mapping,
      };
    } else {
      const compositeSteps: CompositeActionStep[] = aligned.alignedSteps.map((step, idx) => {
        const stepMapping: Record<string, string> = {};
        for (const param of parameterCandidates) {
          if (param.sourceAction === step.actionType) {
            stepMapping[param.parameterName] = param.sourceArgumentPath;
          }
        }

        return {
          actionId: step.actionType,
          actionVersion: step.actionVersion,
          stepOrder: idx,
          parameterMapping: stepMapping,
        };
      });

      executionBinding = {
        type: 'COMPOSITE_ACTION',
        actions: compositeSteps,
      };
    }

    // 8. Generate names and descriptions
    const defaultToolName =
      options?.toolNameOverride || this.generateToolName(aligned.alignedSteps);
    const defaultDescription =
      options?.descriptionOverride ||
      this.generateToolDescription(aligned.alignedSteps, actionRegistry);

    const requiresHuman =
      highestRisk === 'HIGH' ||
      highestRisk === 'CRITICAL' ||
      highestReversibility === 'IRREVERSIBLE';

    // 9. Collect stable constants and volatile fields for report
    const stableConstants: Record<string, unknown> = {};
    for (const step of aligned.alignedSteps) {
      for (const [k, v] of Object.entries(step.stableArguments)) {
        stableConstants[`${step.actionType}.${k}`] = v;
      }
    }

    // 10. Calculate synthesis confidence
    const confidenceScore = Number((aligned.alignmentScore * 0.95).toFixed(2));
    const confidence: SynthesisConfidence =
      confidenceScore >= 0.85 ? 'HIGH' : confidenceScore >= 0.6 ? 'MEDIUM' : 'LOW';

    const reasoning = [
      `Aligned ${aligned.alignedSteps.length} semantic action(s) across ${demonstrations.length} independent demonstrations.`,
      `Inferred ${parameterCandidates.length} variable parameter(s) from observed differences.`,
      `Identified ${Object.keys(stableConstants).length} stable constant argument(s).`,
      `Aggregated conservative risk: '${highestRisk}' based on highest component action risk.`,
      `Aggregated conservative reversibility: '${highestReversibility}' based on least reversible action.`,
    ];

    const report: SynthesisReport = {
      taskSummary: `Synthesized capability for ${defaultToolName}`,
      demonstrationCount: demonstrations.length,
      sourceDemonstrationIds: demonstrations.map(d => d.demonstrationId),
      alignedActionCount: aligned.alignedSteps.length,
      inferredParameters: parameterCandidates,
      stableConstants,
      ignoredVolatileFields: ['requestId', 'timestamp', 'correlationId', 'nonce'],
      confidence,
      confidenceScore,
      reasoning,
      synthesizedAt: new Date(),
    };

    const toolId = `tool_${defaultToolName}_${randomUUID().slice(0, 8)}`;
    const now = new Date();

    const candidateTool: LearnedTool = {
      toolId,
      name: defaultToolName,
      description: defaultDescription,
      version: 1,
      inputSchema,
      executionBinding,
      sourceDemonstrations: demonstrations.map(d => d.demonstrationId),
      demonstrationCount: demonstrations.length,
      parameterProvenance: {},
      reversibility: highestReversibility,
      riskLevel: highestRisk,
      approvalPolicy: {
        requiresHumanAuthorization: requiresHuman,
        requiredRoles: requiresHuman ? ['operations_lead', 'admin'] : [],
        maxAutonomousRiskLevel: 'MEDIUM',
      },
      status: 'DRAFT', // Starts in DRAFT for human review
      creator: {
        id: options?.creatorId || 'system_synthesizer',
        role: options?.creatorRole || 'synthesis_engine',
      },
      createdAt: now,
      updatedAt: now,
      provenance: {
        source: 'synthesis.engine',
        origin: 'https://deputy.internal',
        trustClass: 'SYSTEM_GENERATED',
        retrievedAt: now,
        contentId: `cid_syn_${toolId}`,
      },
      originRestrictions: [],
    };

    return {
      candidateTool,
      report,
    };
  }

  private generateToolName(steps: { actionType: string }[]): string {
    const actionNames = steps.map(s => {
      const parts = s.actionType.split('.');
      return parts.length > 1 ? `${parts[1]}_${parts[0]}` : s.actionType;
    });

    if (actionNames.length === 1) {
      return actionNames[0]!;
    }
    return actionNames.slice(0, 2).join('_with_');
  }

  private generateToolDescription(
    steps: { actionType: string; actionVersion: number }[],
    registry: IActionRegistry,
  ): string {
    const descriptions = steps.map(s => {
      const reg = registry.get(s.actionType, s.actionVersion);
      return reg?.description || s.actionType;
    });

    return descriptions.join(' And ');
  }
}
