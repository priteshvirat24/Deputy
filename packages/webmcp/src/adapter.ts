import { LearnedTool } from '@deputy/domain';
import { detectWebMCPSupport } from './feature-detection.js';
import { ModelContextLocation, resolveModelContext } from './host.js';
import { ExecutionDispatcher, ToolDescriptorTranslator } from './tool-descriptor.js';
import {
  RegisteredToolRecord,
  StructuredRefusal,
  StructuredRefusalCode,
  WebMCPCapabilities,
  WebMCPChangeEvent,
  WebMCPToolDefinition,
} from './types.js';

export type ToolChangeSubscriber = (event: WebMCPChangeEvent) => void;

export class WebMCPAdapter {
  private registeredTools = new Map<string, RegisteredToolRecord>();
  private subscribers = new Set<ToolChangeSubscriber>();
  private capabilities: WebMCPCapabilities;

  constructor() {
    this.capabilities = detectWebMCPSupport();
  }

  /**
   * Get host WebMCP capabilities report.
   */
  public getCapabilities(): WebMCPCapabilities {
    return this.capabilities;
  }

  /**
   * Check if native or polyfilled WebMCP is available.
   */
  public isAvailable(): boolean {
    return this.capabilities.available;
  }

  /**
   * Check if a tool is currently registered.
   */
  public hasTool(toolId: string): boolean {
    return this.registeredTools.has(toolId);
  }

  /**
   * Register a learned tool into the WebMCP surface.
   * Tool must be in ACTIVE status.
   */
  public registerTool(
    tool: LearnedTool,
    executorOrDispatcher:
      | ((params: Record<string, unknown>, signal?: AbortSignal) => Promise<unknown>)
      | ExecutionDispatcher,
  ): WebMCPToolDefinition {
    if (tool.status !== 'ACTIVE') {
      throw new Error(
        `Cannot register tool '${tool.toolId}' with status '${tool.status}'. Tool must be ACTIVE.`,
      );
    }

    // Cancel existing controller if updating registration
    if (this.registeredTools.has(tool.toolId)) {
      this.retireTool(tool.toolId, 'REPLACED_BY_NEW_VERSION');
    }

    const abortController = new AbortController();

    const dispatcher: ExecutionDispatcher =
      typeof executorOrDispatcher === 'function'
        ? { dispatch: async (_t, p, s) => executorOrDispatcher(p, s) }
        : executorOrDispatcher;

    const definition = ToolDescriptorTranslator.toWebMCPDescriptor(
      tool,
      dispatcher,
      abortController,
    );

    // Hand the registration (with its abort signal) to the live host, if any.
    const hostLocation = this.syncWithBrowserHost(definition, abortController.signal);

    const record: RegisteredToolRecord = {
      tool,
      definition,
      abortController,
      registeredAt: new Date(),
      hostLocation,
    };

    this.registeredTools.set(tool.toolId, record);

    this.notifySubscribers({
      type: 'toolchange',
      action: 'REGISTERED',
      toolId: tool.toolId,
      timestamp: new Date(),
    });

    return definition;
  }

  /**
   * Unregister a tool from WebMCP.
   */
  public unregisterTool(
    toolId: string,
    action: 'RETIRED' | 'DISABLED' | 'DELETED' = 'RETIRED',
    reason?: string,
  ): boolean {
    const record = this.registeredTools.get(toolId);
    if (!record) {
      return false;
    }

    // Invariant #14: retirement aborts the AbortSignal handed to the host at
    // registration. On a standard host that alone removes the tool from the
    // surface and cancels in-flight executions.
    record.abortController.abort(reason || `Tool ${action.toLowerCase()} by lifecycle governance.`);
    this.registeredTools.delete(toolId);

    // Legacy polyfills that never accepted the signal need an explicit removal.
    this.removeBrowserHostRegistration(record);

    this.notifySubscribers({
      type: 'toolchange',
      action,
      toolId,
      timestamp: new Date(),
    });

    return true;
  }

  /**
   * Retire a registered tool, aborting in-flight signals and removing it
   * from active registration so it cannot be invoked.
   */
  public retireTool(toolId: string, reason = 'Tool retired by policy or lifecycle'): boolean {
    return this.unregisterTool(toolId, 'RETIRED', reason);
  }

  /**
   * Produce a typed structured refusal without leaking internals.
   */
  public createStructuredRefusal(
    code: StructuredRefusalCode,
    reason: string,
    requiredActions?: string[],
    context?: Record<string, unknown>,
    retryable = false,
  ): StructuredRefusal {
    return {
      refusal: true,
      code,
      reason,
      requiredActions,
      context,
      retryable,
    };
  }

  /**
   * Subscribe to WebMCP capability change events.
   */
  public onToolChange(subscriber: ToolChangeSubscriber): () => void {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }

  public addEventListener(_event: 'toolchange', listener: ToolChangeSubscriber): void {
    this.onToolChange(listener);
  }

  public removeEventListener(_event: 'toolchange', listener: ToolChangeSubscriber): void {
    this.subscribers.delete(listener);
  }

  public getRegisteredTools(): LearnedTool[] {
    return this.listRegisteredTools();
  }

  public async executeTool(
    toolId: string,
    parameters: Record<string, unknown>,
    externalSignal?: AbortSignal,
  ): Promise<unknown> {
    const record = this.registeredTools.get(toolId);
    if (!record) {
      throw new Error(`Tool '${toolId}' is not active or retired.`);
    }
    const res = await record.definition.execute(parameters, externalSignal);
    if (res && typeof res === 'object' && (res as any).refusal) {
      throw new Error(`Execution refused: ${(res as any).code} - ${(res as any).reason}`);
    }
    return res;
  }

  /**
   * List all currently registered active WebMCP tools.
   */
  public listRegisteredTools(): LearnedTool[] {
    return Array.from(this.registeredTools.values()).map(record => record.tool);
  }

  /**
   * Inspect a registered tool by ID.
   */
  public getRegisteredTool(toolId: string): LearnedTool | undefined {
    return this.registeredTools.get(toolId)?.tool;
  }

  /**
   * Hand a registration to the live WebMCP host, located through the single
   * `resolveModelContext()` resolver. Standard hosts receive the abort signal
   * in the options bag so retirement propagates by aborting it. Legacy
   * polyfills that predate the options bag are called positionally.
   *
   * Returns where the registration was actually placed, or 'none'.
   */
  private syncWithBrowserHost(
    definition: WebMCPToolDefinition,
    signal: AbortSignal,
  ): ModelContextLocation {
    const resolved = resolveModelContext();
    if (!resolved.host?.registerTool) return 'none';

    try {
      if (resolved.supportsRegistrationOptions) {
        resolved.host.registerTool(definition, { signal });
      } else {
        resolved.host.registerTool(definition);
      }
      return resolved.location;
    } catch {
      // A host may reject or throw; degrade to internal-only registration.
      return 'none';
    }
  }

  /**
   * Fallback removal for hosts that could not observe the abort signal. Standard
   * hosts retire via the aborted signal alone, so this is a no-op for them —
   * `unregisterTool` is not part of the standard surface and may be absent.
   */
  private removeBrowserHostRegistration(record: RegisteredToolRecord): void {
    if (record.hostLocation === 'none') return;

    const resolved = resolveModelContext();
    // Signal-capable hosts already removed the tool when we aborted its signal.
    if (resolved.supportsRegistrationOptions || !resolved.host?.unregisterTool) return;

    try {
      resolved.host.unregisterTool(record.tool.name);
    } catch {
      // Gracefully handle legacy host unregistration exceptions.
    }
  }

  private notifySubscribers(event: WebMCPChangeEvent): void {
    for (const subscriber of this.subscribers) {
      try {
        subscriber(event);
      } catch (err) {
        console.warn('WebMCP subscriber error:', err);
      }
    }
  }
}
