import { Context } from 'hono';

export interface StructuredErrorResponse {
  error: {
    code: string;
    message: string;
    requestId?: string;
    retryable: boolean;
    details?: unknown;
  };
}

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOOL_NOT_FOUND: 'TOOL_NOT_FOUND',
  TOOL_NOT_ACTIVE: 'TOOL_NOT_ACTIVE',
  TOOL_VERSION_MISMATCH: 'TOOL_VERSION_MISMATCH',
  INVALID_ARGUMENTS: 'INVALID_ARGUMENTS',
  ARGUMENT_DIGEST_MISMATCH: 'ARGUMENT_DIGEST_MISMATCH',
  AUTHORIZATION_REQUIRED: 'AUTHORIZATION_REQUIRED',
  AUTHORIZATION_EXPIRED: 'AUTHORIZATION_EXPIRED',
  AUTHORIZATION_CONSUMED: 'AUTHORIZATION_CONSUMED',
  AUTHORIZATION_REVOKED: 'AUTHORIZATION_REVOKED',
  WEBAUTHN_FAILED: 'WEBAUTHN_FAILED',
  ORIGIN_REJECTED: 'ORIGIN_REJECTED',
  QUARANTINE_VIOLATION: 'QUARANTINE_VIOLATION',
  RESPONSE_QUARANTINED: 'RESPONSE_QUARANTINED',
  UNREGISTERED_ACTION_TARGET: 'UNREGISTERED_ACTION_TARGET',
  EXECUTION_FAILED: 'EXECUTION_FAILED',
  PARTIAL_EXECUTION: 'PARTIAL_EXECUTION',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export function formatErrorResponse(
  c: Context,
  code: string,
  message: string,
  status: 400 | 401 | 403 | 404 | 409 | 429 | 500 | 503 = 400,
  details?: unknown,
  retryable = false,
) {
  const requestId = c.get('requestId') || undefined;

  const body: StructuredErrorResponse = {
    error: {
      code,
      message,
      requestId,
      retryable,
      details,
    },
  };

  return c.json(body, status);
}
