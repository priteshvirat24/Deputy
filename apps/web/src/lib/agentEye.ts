import { LearnedTool } from '@deputy/domain';
import {
  WebMCPAdapter,
  WebMCPToolDefinition,
  detectWebMCPSupport,
  resolveModelContext,
} from '@deputy/webmcp';

/**
 * Client-side WebMCP wiring for the Agent's-Eye View.
 *
 * A single browser-side WebMCPAdapter registers the learned tools into the
 * resolved host (document.modelContext when present — e.g. a Chrome running
 * with the WebMCP testing flag). This is the code path that actually exercises
 * A1 (resolution) and A2 (signal-based registration/retirement) in a browser,
 * and it is what the panel renders so WebMCP leverage is visible, not asserted.
 *
 * The executor never executes an action directly in the page. It forwards the
 * call to DEPUTY's server-side gate (/api/tool-proposals); an irreversible tool
 * comes back as a structured refusal (REQUIRE_HUMAN_AUTHORIZATION). Authority is
 * always re-decided server-side (Invariant 18).
 */

export interface AgentEyeSnapshot {
  lastProposal?: unknown;
  lastResponse?: unknown;
  lastRefusal?: unknown;
}

type Listener = () => void;

const snapshot: AgentEyeSnapshot = {};
const listeners = new Set<Listener>();

function emit(): void {
  for (const l of listeners) l();
}

export function subscribeAgentEye(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAgentEyeSnapshot(): AgentEyeSnapshot {
  return snapshot;
}

export function recordProposal(proposal: unknown): void {
  snapshot.lastProposal = proposal;
  emit();
}

function isRefusalLike(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    v.refusal === true || v.decision === 'REQUIRE_HUMAN_AUTHORIZATION' || v.decision === 'DENY'
  );
}

export function recordResponse(response: unknown): void {
  snapshot.lastResponse = response;
  if (isRefusalLike(response)) {
    snapshot.lastRefusal = response;
  }
  emit();
}

let adapter: WebMCPAdapter | null = null;

export function getClientAdapter(): WebMCPAdapter {
  if (!adapter) adapter = new WebMCPAdapter();
  return adapter;
}

/**
 * Register (or re-register) the current learned tools into the client adapter.
 * Tools no longer present are retired, which aborts their AbortSignal — the
 * canonical WebMCP retirement path.
 */
export function syncClientTools(tools: LearnedTool[]): WebMCPToolDefinition[] {
  const a = getClientAdapter();
  const desired = new Set(tools.map(t => t.toolId));

  for (const existing of a.listRegisteredTools()) {
    if (!desired.has(existing.toolId)) {
      a.retireTool(existing.toolId, 'No longer in active tool set');
    }
  }

  const definitions: WebMCPToolDefinition[] = [];
  for (const tool of tools) {
    if (tool.status !== 'ACTIVE') continue;
    if (a.hasTool(tool.toolId)) {
      a.retireTool(tool.toolId, 'Re-syncing definition');
    }
    definitions.push(a.registerTool(tool, agentExecutor(tool)));
  }
  return definitions;
}

function agentExecutor(tool: LearnedTool) {
  return async (params: Record<string, unknown>): Promise<unknown> => {
    const proposal = {
      proposalId: `prop_agenteye_${Date.now()}`,
      toolId: tool.toolId,
      toolVersion: tool.version,
      arguments: params,
      requestId: `req_agenteye_${Date.now()}`,
      proposedBy: { agentId: 'agent_eye_view', origin: window.location.origin },
      timestamp: new Date().toISOString(),
    };
    recordProposal(proposal);
    const res = await fetch('/api/tool-proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proposal),
    });
    const data = await res.json();
    recordResponse(data);
    return data;
  };
}

export { detectWebMCPSupport, resolveModelContext };
