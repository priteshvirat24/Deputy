import { randomUUID } from 'node:crypto';
import { CONSTANTS } from '@deputy/config';
import {
  ActionExecutionContext,
  Authorization,
  CompositeActionBinding,
  ExecutionOutcome,
  IActionRegistry,
  IToolExecutor,
  LearnedTool,
  StepExecutionRecord,
  ToolExecutionResult,
  ToolProposal,
} from '@deputy/domain';
import { computeArgumentDigest } from './argument-digest.js';
import { AuthorizationVerifier } from './authorization-verifier.js';
import { OriginValidator } from './origin-validator.js';
import { ResponseBudgetEnforcer } from './quarantine/response-budget.js';

export function getNestedProperty(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = path.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = current[part];
  }
  return current;
}

export class ToolExecutor implements IToolExecutor {
  private budgetEnforcer: ResponseBudgetEnforcer;

  constructor(
    private actionRegistry: IActionRegistry,
    private verifier: AuthorizationVerifier = new AuthorizationVerifier(),
    budgetEnforcer?: ResponseBudgetEnforcer,
  ) {
    this.budgetEnforcer = budgetEnforcer || new ResponseBudgetEnforcer();
  }

  /**
   * Execute a learned tool through the strict security boundary.
   * Enforces:
   * - Invariant 2: Only explicitly registered trusted application actions can be invoked
   * - Invariant 4: Authorization is cryptographically bound to canonical arguments
   * - Invariant 5: Authorization is bound to tool ID and version
   * - Invariant 6: Authorization is single-use
   * - Invariant 9: Inactive or retired tools cannot execute
   * - Invariant 11: Learned tools cannot execute arbitrary code
   * - Invariant 12: Origin access is deny-by-default
   */
  public async execute(
    proposal: ToolProposal,
    tool: LearnedTool,
    authorization?: Authorization,
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const executionId = `exec_${randomUUID()}`;

    // 1. Invariant 9: Inactive or retired tools cannot execute
    if (tool.status !== 'ACTIVE') {
      return {
        executionId,
        toolId: tool.toolId,
        toolVersion: tool.version,
        success: false,
        outcome: 'NO_EFFECT',
        error: {
          code: tool.status === 'RETIRED' ? 'TOOL_RETIRED' : 'TOOL_NOT_ACTIVE',
          message: `Execution rejected: Tool '${tool.name}' is currently in state '${tool.status}'. Only ACTIVE tools may execute.`,
        },
        executedAt: new Date(startTime),
        durationMs: Date.now() - startTime,
      };
    }

    // 2. Invariant 12: Origin verification
    if (proposal.proposedBy.origin) {
      const allowedOrigins = tool.originRestrictions || [];
      if (allowedOrigins.length > 0) {
        const originCheck = OriginValidator.validate(proposal.proposedBy.origin, allowedOrigins);
        if (!originCheck.allowed) {
          return {
            executionId,
            toolId: tool.toolId,
            toolVersion: tool.version,
            success: false,
            outcome: 'NO_EFFECT',
            error: {
              code: 'ORIGIN_NOT_ALLOWED',
              message: `Execution rejected by origin policy: ${originCheck.refusalReason}`,
            },
            executedAt: new Date(startTime),
            durationMs: Date.now() - startTime,
          };
        }
      }
    }

    // 3. Response / Argument budget check
    const argBudget = this.budgetEnforcer.evaluate(proposal.arguments);
    if (!argBudget.withinBudget) {
      return {
        executionId,
        toolId: tool.toolId,
        toolVersion: tool.version,
        success: false,
        outcome: 'NO_EFFECT',
        error: {
          code: argBudget.refusalCode || 'RESPONSE_QUARANTINED',
          message: `Execution rejected by quarantine budget: ${argBudget.refusalReason}`,
        },
        executedAt: new Date(startTime),
        durationMs: Date.now() - startTime,
      };
    }

    // 4. Invariant 2 & 11: Verify binding type
    const binding = tool.executionBinding;
    if (
      !binding ||
      (binding.type !== 'APPLICATION_ACTION' && binding.type !== 'COMPOSITE_ACTION')
    ) {
      return {
        executionId,
        toolId: tool.toolId,
        toolVersion: tool.version,
        success: false,
        outcome: 'NO_EFFECT',
        error: {
          code: 'ILLEGAL_EXECUTION_BINDING',
          message:
            'Security violation: Learned tool execution binding is not a registered application action. Arbitrary code execution is forbidden.',
        },
        executedAt: new Date(startTime),
        durationMs: Date.now() - startTime,
      };
    }

    // 5. Validate actions in ActionRegistry
    if (binding.type === 'APPLICATION_ACTION') {
      const registered = this.actionRegistry.get(binding.actionId, binding.actionVersion);
      if (!registered) {
        return {
          executionId,
          toolId: tool.toolId,
          toolVersion: tool.version,
          success: false,
          outcome: 'NO_EFFECT',
          error: {
            code: 'UNREGISTERED_ACTION_TARGET',
            message: `Security violation: Target action '${binding.actionId}' (v${binding.actionVersion}) is not registered in the trusted action registry.`,
          },
          executedAt: new Date(startTime),
          durationMs: Date.now() - startTime,
        };
      }
    } else {
      for (const step of binding.actions) {
        if (!this.actionRegistry.has(step.actionId, step.actionVersion)) {
          return {
            executionId,
            toolId: tool.toolId,
            toolVersion: tool.version,
            success: false,
            outcome: 'NO_EFFECT',
            error: {
              code: 'UNREGISTERED_ACTION_TARGET',
              message: `Security violation: Composite step action '${step.actionId}' (v${step.actionVersion}) is not registered in the trusted action registry.`,
            },
            executedAt: new Date(startTime),
            durationMs: Date.now() - startTime,
          };
        }
      }
    }

    // 6. Enforce Authorization if required
    const requiresAuth =
      tool.approvalPolicy.requiresHumanAuthorization ||
      tool.riskLevel === 'HIGH' ||
      tool.riskLevel === 'CRITICAL' ||
      tool.reversibility === 'IRREVERSIBLE';

    if (requiresAuth && !authorization) {
      return {
        executionId,
        toolId: tool.toolId,
        toolVersion: tool.version,
        success: false,
        outcome: 'NO_EFFECT',
        error: {
          code: 'AUTHORIZATION_REQUIRED',
          message: `Execution rejected: Tool '${tool.name}' requires explicit human authorization. No valid authorization provided.`,
        },
        executedAt: new Date(startTime),
        durationMs: Date.now() - startTime,
      };
    }

    if (authorization) {
      // Invariant 6: Single-use check
      if (authorization.status === 'CONSUMED') {
        return {
          executionId,
          toolId: tool.toolId,
          toolVersion: tool.version,
          success: false,
          outcome: 'NO_EFFECT',
          error: {
            code: 'ALREADY_CONSUMED',
            message: `Authorization '${authorization.authorizationId}' has already been consumed (replay attack detected).`,
          },
          executedAt: new Date(startTime),
          durationMs: Date.now() - startTime,
        };
      }

      // Invariant 5: Tool ID & Version Check
      if (authorization.toolId !== tool.toolId) {
        return {
          executionId,
          toolId: tool.toolId,
          toolVersion: tool.version,
          success: false,
          outcome: 'NO_EFFECT',
          error: {
            code: 'TOOL_MISMATCH',
            message: `Authorization tool ID '${authorization.toolId}' does not match target tool ID '${tool.toolId}'.`,
          },
          executedAt: new Date(startTime),
          durationMs: Date.now() - startTime,
        };
      }

      if (authorization.toolVersion !== tool.version) {
        return {
          executionId,
          toolId: tool.toolId,
          toolVersion: tool.version,
          success: false,
          outcome: 'NO_EFFECT',
          error: {
            code: 'TOOL_VERSION_MISMATCH',
            message: `Authorization tool version v${authorization.toolVersion} does not match target tool version v${tool.version}.`,
          },
          executedAt: new Date(startTime),
          durationMs: Date.now() - startTime,
        };
      }

      // Invariant 4: Exact argument digest check
      const canonicalDigest = computeArgumentDigest(proposal.arguments);
      if (canonicalDigest !== authorization.argumentDigest) {
        return {
          executionId,
          toolId: tool.toolId,
          toolVersion: tool.version,
          success: false,
          outcome: 'NO_EFFECT',
          error: {
            code: 'ARGUMENT_DIGEST_MISMATCH',
            message: `Security violation: Proposal arguments do not match authorized arguments. Expected digest: ${authorization.argumentDigest}, actual: ${canonicalDigest}`,
          },
          executedAt: new Date(startTime),
          durationMs: Date.now() - startTime,
        };
      }

      // Verify authorization status and nonce
      const verification = this.verifier.verify(authorization, proposal, true);
      if (!verification.valid) {
        return {
          executionId,
          toolId: tool.toolId,
          toolVersion: tool.version,
          success: false,
          outcome: 'NO_EFFECT',
          error: {
            code: 'AUTHORIZATION_INVALID',
            message: `Authorization rejected: ${verification.reason}`,
          },
          executedAt: new Date(startTime),
          durationMs: Date.now() - startTime,
        };
      }

      // Atomically mark authorization as CONSUMED (Single-use Invariant 6)
      authorization.status = 'CONSUMED';
      authorization.consumedAt = new Date();
      authorization.consumedByProposalId = proposal.proposalId;
    }

    const executionContext: ActionExecutionContext = {
      correlationId: proposal.requestId,
      actorId: authorization?.actor.id || proposal.proposedBy.agentId,
      requestId: proposal.requestId,
      timestamp: new Date(),
    };

    // 7A. Single Action Execution
    if (binding.type === 'APPLICATION_ACTION') {
      const registeredAction = this.actionRegistry.get(binding.actionId, binding.actionVersion)!;
      const mappedArgs: Record<string, unknown> = { ...proposal.arguments };
      if (binding.parameterMapping) {
        for (const [targetParam, sourceParam] of Object.entries(binding.parameterMapping)) {
          if (sourceParam in proposal.arguments) {
            mappedArgs[targetParam] = proposal.arguments[sourceParam];
          }
        }
      }

      try {
        const resultPromise = registeredAction.handler(mappedArgs, executionContext);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(new Error(`Execution timed out after ${CONSTANTS.EXECUTION_TIMEOUT_MS}ms`)),
            CONSTANTS.EXECUTION_TIMEOUT_MS,
          ),
        );

        const output = await Promise.race([resultPromise, timeoutPromise]);

        // QUARANTINE: Output budget check
        const outBudget = this.budgetEnforcer.evaluate(output);
        if (!outBudget.withinBudget) {
          return {
            executionId,
            toolId: tool.toolId,
            toolVersion: tool.version,
            success: false,
            outcome: 'NO_EFFECT',
            error: {
              code: outBudget.refusalCode || 'RESPONSE_QUARANTINED',
              message: `Output rejected by quarantine budget: ${outBudget.refusalReason}`,
            },
            executedAt: new Date(startTime),
            durationMs: Date.now() - startTime,
          };
        }

        return {
          executionId,
          toolId: tool.toolId,
          toolVersion: tool.version,
          success: true,
          outcome: 'SUCCESS',
          output,
          executedAt: new Date(startTime),
          durationMs: Date.now() - startTime,
        };
      } catch (err: unknown) {
        return {
          executionId,
          toolId: tool.toolId,
          toolVersion: tool.version,
          success: false,
          outcome: 'NO_EFFECT',
          error: {
            code: 'HANDLER_EXECUTION_ERROR',
            message: `Action handler encountered an error: ${err instanceof Error ? err.message : String(err)}`,
          },
          executedAt: new Date(startTime),
          durationMs: Date.now() - startTime,
        };
      }
    }

    // 7B. Multi-Action Composite Execution
    return this.executeComposite(binding, proposal, tool, executionId, startTime, executionContext);
  }

  /**
   * Execute multi-action composite steps with declarative dataflow,
   * step execution traces, and automatic rollback compensation.
   */
  private async executeComposite(
    binding: CompositeActionBinding,
    proposal: ToolProposal,
    tool: LearnedTool,
    executionId: string,
    startTime: number,
    ctx: ActionExecutionContext,
  ): Promise<ToolExecutionResult> {
    const completedActions: { actionId: string; stepOrder: number; result: unknown }[] = [];
    const stepRecords: StepExecutionRecord[] = [];
    let sharedContext: Record<string, unknown> = {};

    // 1. Static pre-validation of declarative dataflow mappings
    for (const step of binding.actions) {
      if (step.dataflowMappings) {
        for (const df of step.dataflowMappings) {
          if (df.sourceStepOrder >= step.stepOrder) {
            return {
              executionId,
              toolId: tool.toolId,
              toolVersion: tool.version,
              success: false,
              outcome: 'NO_EFFECT',
              error: {
                code: 'INVALID_DATAFLOW_MAPPING',
                message: `Circular or forward dataflow mapping: step ${step.stepOrder} references future or self step ${df.sourceStepOrder}`,
              },
              executedAt: new Date(startTime),
              durationMs: Date.now() - startTime,
            };
          }
        }
      }
    }

    // 2. Sequential execution loop
    for (let i = 0; i < binding.actions.length; i++) {
      const step = binding.actions[i]!;
      const action = this.actionRegistry.get(step.actionId, step.actionVersion)!;
      const stepStartTime = Date.now();

      // Map parameters: check tool proposal arguments and parameter mappings
      const stepArgs: Record<string, unknown> = {};

      // Fill from explicit parameterMapping (toolParam -> actionArgPath)
      for (const [toolParam, actionArgPath] of Object.entries(step.parameterMapping)) {
        if (toolParam in proposal.arguments) {
          stepArgs[actionArgPath] = proposal.arguments[toolParam];
        }
      }

      // Also copy any direct matching arguments
      for (const [k, v] of Object.entries(proposal.arguments)) {
        if (!(k in stepArgs)) {
          stepArgs[k] = v;
        }
      }

      // Resolve explicit declarative dataflow mappings
      if (step.dataflowMappings && step.dataflowMappings.length > 0) {
        for (const df of step.dataflowMappings) {
          const sourceRecord = stepRecords.find(r => r.stepOrder === df.sourceStepOrder);
          if (!sourceRecord || sourceRecord.status !== 'SUCCESS') {
            const errRecord: StepExecutionRecord = {
              stepOrder: step.stepOrder,
              actionId: step.actionId,
              actionVersion: step.actionVersion,
              inputDigest: computeArgumentDigest(stepArgs),
              startedAt: new Date(stepStartTime),
              completedAt: new Date(),
              durationMs: Date.now() - stepStartTime,
              status: 'FAILURE',
              error: `Dataflow source step ${df.sourceStepOrder} was not executed successfully.`,
              compensationStatus: 'NONE',
              correlationId: ctx.correlationId,
            };
            stepRecords.push(errRecord);

            return this.handleCompositeFailure(
              binding,
              tool,
              executionId,
              startTime,
              stepRecords,
              completedActions,
              step.actionId,
              `Dataflow source step ${df.sourceStepOrder} is unavailable.`,
              ctx,
            );
          }

          const extractedVal = getNestedProperty(sourceRecord.output, df.sourcePath);
          if (extractedVal === undefined) {
            const errRecord: StepExecutionRecord = {
              stepOrder: step.stepOrder,
              actionId: step.actionId,
              actionVersion: step.actionVersion,
              inputDigest: computeArgumentDigest(stepArgs),
              startedAt: new Date(stepStartTime),
              completedAt: new Date(),
              durationMs: Date.now() - stepStartTime,
              status: 'FAILURE',
              error: `Dataflow path '${df.sourcePath}' not found in step ${df.sourceStepOrder} output.`,
              compensationStatus: 'NONE',
              correlationId: ctx.correlationId,
            };
            stepRecords.push(errRecord);

            return this.handleCompositeFailure(
              binding,
              tool,
              executionId,
              startTime,
              stepRecords,
              completedActions,
              step.actionId,
              `Dataflow path '${df.sourcePath}' not found in step ${df.sourceStepOrder} output.`,
              ctx,
            );
          }

          stepArgs[df.targetParam] = extractedVal;
        }
      } else {
        // Backwards compatibility: inject prior step outputs if customerId or reference generated
        if (sharedContext['customerId'] && !stepArgs['customerId']) {
          stepArgs['customerId'] = sharedContext['customerId'];
        }
      }

      const stepDigest = computeArgumentDigest(stepArgs);

      try {
        const stepPromise = action.handler(stepArgs, ctx);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(`Step execution timed out after ${CONSTANTS.EXECUTION_TIMEOUT_MS}ms`),
              ),
            CONSTANTS.EXECUTION_TIMEOUT_MS,
          ),
        );

        const stepResult = await Promise.race([stepPromise, timeoutPromise]);
        const stepEndTime = Date.now();

        completedActions.push({
          actionId: step.actionId,
          stepOrder: step.stepOrder,
          result: stepResult,
        });

        stepRecords.push({
          stepOrder: step.stepOrder,
          actionId: step.actionId,
          actionVersion: step.actionVersion,
          inputDigest: stepDigest,
          startedAt: new Date(stepStartTime),
          completedAt: new Date(stepEndTime),
          durationMs: stepEndTime - stepStartTime,
          status: 'SUCCESS',
          output: stepResult,
          compensationStatus: step.compensation ? 'PENDING' : 'NOT_REQUIRED',
          correlationId: ctx.correlationId,
        });

        // Accumulate context for downstream steps
        if (stepResult && typeof stepResult === 'object') {
          sharedContext = { ...sharedContext, ...(stepResult as Record<string, unknown>) };
        }
      } catch (err: unknown) {
        const stepEndTime = Date.now();
        const message = err instanceof Error ? err.message : String(err);

        stepRecords.push({
          stepOrder: step.stepOrder,
          actionId: step.actionId,
          actionVersion: step.actionVersion,
          inputDigest: stepDigest,
          startedAt: new Date(stepStartTime),
          completedAt: new Date(stepEndTime),
          durationMs: stepEndTime - stepStartTime,
          status: 'FAILURE',
          error: message,
          compensationStatus: 'NONE',
          correlationId: ctx.correlationId,
        });

        return this.handleCompositeFailure(
          binding,
          tool,
          executionId,
          startTime,
          stepRecords,
          completedActions,
          step.actionId,
          message,
          ctx,
        );
      }
    }

    return {
      executionId,
      toolId: tool.toolId,
      toolVersion: tool.version,
      success: true,
      outcome: 'SUCCESS',
      output: {
        completedActions,
        finalOutput: completedActions[completedActions.length - 1]?.result,
      },
      stepRecords,
      executedAt: new Date(startTime),
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Handle partial execution failure in composite workflow, executing
   * reverse compensation handlers if configured.
   */
  private async handleCompositeFailure(
    binding: CompositeActionBinding,
    tool: LearnedTool,
    executionId: string,
    startTime: number,
    stepRecords: StepExecutionRecord[],
    completedActions: { actionId: string; stepOrder: number; result: unknown }[],
    failedActionId: string,
    errorMessage: string,
    ctx: ActionExecutionContext,
  ): Promise<ToolExecutionResult> {
    if (completedActions.length === 0) {
      return {
        executionId,
        toolId: tool.toolId,
        toolVersion: tool.version,
        success: false,
        outcome: 'NO_EFFECT',
        stepRecords,
        error: {
          code: 'EXECUTION_FAILED',
          message: `Step '${failedActionId}' failed on initial step: ${errorMessage}`,
        },
        executedAt: new Date(startTime),
        durationMs: Date.now() - startTime,
      };
    }

    const isCompensatable =
      binding.executionMode === 'COMPENSATABLE' || tool.reversibility === 'COMPENSATABLE';

    let allCompensated = true;
    let anyCompensationAttempted = false;

    if (isCompensatable) {
      // Execute compensation for completed steps in reverse order
      for (let j = completedActions.length - 1; j >= 0; j--) {
        const completed = completedActions[j]!;
        const stepDef = binding.actions.find(s => s.stepOrder === completed.stepOrder);
        const record = stepRecords.find(r => r.stepOrder === completed.stepOrder);

        if (stepDef?.compensation) {
          anyCompensationAttempted = true;
          const compAction = this.actionRegistry.get(
            stepDef.compensation.compensationActionId,
            stepDef.compensation.compensationActionVersion,
          );

          if (compAction) {
            try {
              const compArgs: Record<string, unknown> = {};
              if (completed.result && typeof completed.result === 'object') {
                Object.assign(compArgs, completed.result);
              }
              for (const [target, src] of Object.entries(stepDef.compensation.parameterMapping)) {
                if (compArgs[src] !== undefined) {
                  compArgs[target] = compArgs[src];
                }
              }

              await compAction.handler(compArgs, ctx);
              if (record) record.compensationStatus = 'COMPENSATED';
            } catch {
              allCompensated = false;
              if (record) record.compensationStatus = 'COMPENSATION_FAILED';
            }
          } else {
            allCompensated = false;
            if (record) record.compensationStatus = 'COMPENSATION_FAILED';
          }
        }
      }
    }

    let outcome: ExecutionOutcome = 'PARTIAL_EFFECT';
    if (anyCompensationAttempted) {
      outcome = allCompensated ? 'COMPENSATED' : 'COMPENSATION_FAILED';
    }

    return {
      executionId,
      toolId: tool.toolId,
      toolVersion: tool.version,
      success: false,
      outcome,
      output: {
        completedActions,
        failedAction: failedActionId,
        compensationStatus: outcome,
      },
      stepRecords,
      error: {
        code: 'PARTIAL_EXECUTION_FAILURE',
        message: `Step '${failedActionId}' failed: ${errorMessage}. Workflow outcome: ${outcome}.`,
        details: { completedCount: completedActions.length, outcome },
      },
      executedAt: new Date(startTime),
      durationMs: Date.now() - startTime,
    };
  }
}
