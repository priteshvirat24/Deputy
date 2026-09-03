import { resolveModelContext } from './host.js';
import { WebMCPCapabilities } from './types.js';

/**
 * Report runtime WebMCP capabilities for the current host.
 * Delegates location to `resolveModelContext()` so there is exactly one place
 * in the codebase that knows where the host object lives.
 *
 * Never throws — Node.js, a plain browser, and a WebMCP browser all return a
 * capability report rather than an exception (Invariant 16 / Test 10).
 */
export function detectWebMCPSupport(): WebMCPCapabilities {
  const resolved = resolveModelContext();

  if (!resolved.host) {
    return {
      available: false,
      provider: 'NONE',
      location: 'none',
      deprecatedAlias: false,
      supportsSignalRetirement: false,
      reason: resolved.reason,
    };
  }

  return {
    available: true,
    provider: resolved.location === 'window.webMCP' ? 'POLYFILL' : 'NATIVE_BROWSER',
    location: resolved.location,
    deprecatedAlias: resolved.deprecatedAlias,
    supportsSignalRetirement: resolved.supportsRegistrationOptions,
    version: resolved.version ?? '1.0.0',
    reason: resolved.reason,
  };
}
