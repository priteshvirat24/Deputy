import { LearnedTool, ReversibilityClassification, RiskLevel } from '@deputy/domain';

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

export interface WebMCPToolAnnotations {
  riskLevel: RiskLevel;
  reversibility: ReversibilityClassification;
  requiresHumanAuthorization: boolean;
  version: number;
  originRestrictions: string[];
}

export interface WebMCPToolDefinition {
  name: string;
  description: string;
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
  version?: string;
  reason?: string;
}

export interface RegisteredToolRecord {
  tool: LearnedTool;
  definition: WebMCPToolDefinition;
  abortController: AbortController;
  registeredAt: Date;
}
