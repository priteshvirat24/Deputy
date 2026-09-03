import { WebMCPCapabilities } from './types.js';

/**
 * Detect runtime WebMCP capabilities in the current host environment.
 * Gracefully handles Node.js, standard browsers, or WebMCP-enabled browsers
 * without throwing exceptions (Invariant 10 / Test 10).
 */
export function detectWebMCPSupport(): WebMCPCapabilities {
  try {
    // Check if we are in an environment with a global window or navigator
    const globalScope =
      typeof globalThis !== 'undefined' ? (globalThis as Record<string, unknown>) : null;

    if (!globalScope) {
      return {
        available: false,
        provider: 'NONE',
        reason: 'No global execution environment detected.',
      };
    }

    // Check for native navigator.modelContext or window.webMCP
    const navigatorObj = (globalScope['navigator'] as Record<string, unknown>) || null;
    const modelContext = (navigatorObj?.['modelContext'] || globalScope['webMCP']) as Record<
      string,
      unknown
    > | null;

    if (modelContext && typeof modelContext['registerTool'] === 'function') {
      return {
        available: true,
        provider: 'NATIVE_BROWSER',
        version: typeof modelContext['version'] === 'string' ? modelContext['version'] : '1.0.0',
      };
    }

    return {
      available: false,
      provider: 'NONE',
      reason:
        'Browser does not expose native WebMCP API (navigator.modelContext). Fallback mode active.',
    };
  } catch (err: unknown) {
    return {
      available: false,
      provider: 'NONE',
      reason: `WebMCP feature detection error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
