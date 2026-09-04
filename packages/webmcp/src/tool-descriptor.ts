import { LearnedTool, ReversibilityClassification } from '@deputy/domain';
import { McpBehaviourHints, StructuredRefusal, WebMCPToolDefinition } from './types.js';

export interface ExecutionDispatcher {
  dispatch: (
    tool: LearnedTool,
    params: Record<string, unknown>,
    signal?: AbortSignal,
  ) => Promise<unknown | StructuredRefusal>;
}

/**
 * Derive the standard MCP behavioural hints from DEPUTY's reversibility model.
 * These are advisory only (Invariant 18): the authority decision is always
 * re-made server-side and never reads them.
 *
 * - readOnlyHint is always false — every learned tool binds to a mutating
 *   application action, so none can honestly claim to be read-only.
 * - destructiveHint is true for IRREVERSIBLE and COMPENSATABLE actions;
 *   compensation is a second write, not an undo, so it counts as destructive.
 * - idempotentHint is omitted: idempotence cannot be inferred from a single
 *   demonstration (WebMCP spec issue #267, turn awareness).
 */
export function deriveBehaviourHints(
  reversibility: ReversibilityClassification,
): McpBehaviourHints {
  return {
    readOnlyHint: false,
    destructiveHint: reversibility !== 'REVERSIBLE',
  };
}

export class ToolDescriptorTranslator {
  /**
   * Convert a persisted LearnedTool into a strictly bounded WebMCP tool definition.
   * Crucial invariant: Never accepts arbitrary generated code or eval.
   * The execution closure contains strictly trusted tool references dispatched
   * into the secure policy and ActionRegistry pipeline.
   */
  public static toWebMCPDescriptor(
    tool: LearnedTool,
    dispatcher: ExecutionDispatcher,
    abortController: AbortController,
  ): WebMCPToolDefinition {
    return {
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      // Deprecated alias kept for pre-standard consumers that read `parameters`.
      parameters: tool.inputSchema,
      annotations: {
        ...deriveBehaviourHints(tool.reversibility),
        riskLevel: tool.riskLevel,
        reversibility: tool.reversibility,
        requiresHumanAuthorization: tool.approvalPolicy.requiresHumanAuthorization,
        version: tool.version,
        originRestrictions: tool.originRestrictions,
      },
      execute: async (parameters: Record<string, unknown>, externalSignal?: AbortSignal) => {
        // Enforce: Tool must be ACTIVE
        if (tool.status !== 'ACTIVE') {
          return {
            refusal: true,
            code: 'TOOL_NOT_ACTIVE',
            reason: `Tool '${tool.name}' is currently in state '${tool.status}' and cannot be invoked.`,
            retryable: false,
          };
        }

        // Enforce: In-flight abort signal check
        if (abortController.signal.aborted) {
          return {
            refusal: true,
            code: 'TOOL_RETIRED',
            reason: `Invocation cancelled: ${abortController.signal.reason || 'Tool lifecycle ended.'}`,
            retryable: false,
          };
        }

        if (externalSignal?.aborted) {
          return {
            refusal: true,
            code: 'INTERNAL_ERROR',
            reason: 'Invocation aborted by caller signal.',
            retryable: true,
          };
        }

        // Delegate strictly to trusted execution pipeline
        return dispatcher.dispatch(tool, parameters, abortController.signal);
      },
    };
  }
}
