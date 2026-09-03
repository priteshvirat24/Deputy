/**
 * Core security, operational, and lifecycle constants for DEPUTY.
 */

export const CONSTANTS = {
  // Authorization constraints
  DEFAULT_AUTHORIZATION_TTL_MS: 5 * 60 * 1000, // 5 minutes
  MAX_AUTHORIZATION_TTL_MS: 30 * 60 * 1000, // 30 minutes
  NONCE_LENGTH_BYTES: 32,

  // Demonstration limits
  MAX_DEMONSTRATION_ACTIONS: 1000,
  MAX_DEMONSTRATION_DURATION_MS: 60 * 60 * 1000, // 1 hour

  // Execution & Payload limits
  MAX_ARGUMENT_PAYLOAD_BYTES: 1024 * 1024, // 1 MB
  EXECUTION_TIMEOUT_MS: 30 * 1000, // 30 seconds

  // WebMCP specifications
  WEBMCP_SPEC_VERSION: 'draft-2025-01',
  WEBMCP_PROTOCOL_PREFIX: 'webmcp://',

  // Rate Limiting defaults
  DEFAULT_RATE_LIMIT_MAX: 100,
  DEFAULT_RATE_LIMIT_WINDOW_MS: 60 * 1000, // 1 minute
} as const;
