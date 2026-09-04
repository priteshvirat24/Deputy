import { LearnedTool, ReversibilityClassification, RiskLevel } from '@deputy/domain';
import { ModelContextLocation } from './host.js';

export type StructuredRefusalCode =
  | 'AUTHORIZATION_REQUIRED'
  | 'AUTHORIZATION_INVALID'
  | 'AUTHORIZATION_EXPIRED'
  | 'AUTHORIZATION_REVOKED'
  | 'ARGUMENT_DIGEST_MISMATCH'
  | 'TOOL_NOT_ACTIVE'
  | 'TOOL_NOT_FOUND'
  | 'ORIGIN_NOT_ALLOWED'
  | 'PROVENANCE_BLOCKED'
  | 'UNTRUSTED_CONTENT'
  | 'POLICY_DENIED'
  | 'ACTION_NOT_ALLOWED'
  | 'WEBMCP_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'NONCE_REPLAY'
  | 'RESPONSE_QUARANTINED'
  | 'ALREADY_CONSUMED'
  | 'TOOL_RETIRED'
  | 'INPUT_VALIDATION_FAILED'
  | 'POLICY_VIOLATION'
  | 'INTERNAL_ERROR';

export interface StructuredRefusal {
  refusal: true;
  code: StructuredRefusalCode;
  reason: string;
  requiredActions?: string[];
  context?: Record<string, unknown>;
  retryable?: boolean;
}

/**
 * Standard MCP behavioural hints. Advisory only — every hint is re-derived
 * server-side before execution, and no authority decision reads them
 * (Invariant 18). They exist so ecosystem hosts that already understand MCP
 * annotations can reason about a DEPUTY tool without knowing DEPUTY.
 */
export interface McpBehaviourHints {
  /** Always false: every learned tool binds to a mutating application action. */
  readOnlyHint: false;
  /** True for IRREVERSIBLE and COMPENSATABLE (compensation is a second write, not an undo). */
  destructiveHint: boolean;
  /**
   * Deliberately absent. Idempotence cannot be inferred from a single
   * demonstration; see WebMCP spec issue #267 (turn awareness).
   */
  idempotentHint?: undefined;
}

export interface WebMCPToolAnnotations extends McpBehaviourHints {
  riskLevel: RiskLevel;
  reversibility: ReversibilityClassification;
  requiresHumanAuthorization: boolean;
  version: number;
  originRestrictions: string[];
}

export interface WebMCPToolDefinition {
  name: string;
  description: string;
  /** Canonical WebMCP/MCP field name for the argument schema. */
  inputSchema: Record<string, unknown>;
  /** Deprecated alias for `inputSchema`, kept for pre-standard consumers. */
  parameters: Record<string, unknown>;
  annotations?: WebMCPToolAnnotations;
  execute: (
    parameters: Record<string, unknown>,
    signal?: AbortSignal,
  ) => Promise<unknown | StructuredRefusal>;
}

export interface WebMCPChangeEvent {
  type: 'toolchange';
  action: 'REGISTERED' | 'RETIRED' | 'DISABLED' | 'DELETED' | 'UPDATED';
  toolId: string;
  timestamp: Date;
}

export interface WebMCPCapabilities {
  available: boolean;
  provider: 'NATIVE_BROWSER' | 'POLYFILL' | 'NONE';
  /** Where the host object was found. */
  location: ModelContextLocation;
  /** True when resolution fell back to the deprecated navigator alias. */
  deprecatedAlias: boolean;
  /** True when the host accepts `registerTool(tool, { signal })`. */
  supportsSignalRetirement: boolean;
  version?: string;
  reason?: string;
}

export interface RegisteredToolRecord {
  tool: LearnedTool;
  definition: WebMCPToolDefinition;
  abortController: AbortController;
  registeredAt: Date;
  /** Where this registration was actually handed to a host, if anywhere. */
  hostLocation: ModelContextLocation;
}
