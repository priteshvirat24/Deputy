/**
 * Single source of truth for locating the WebMCP host object.
 *
 * The specification exposes the ModelContext getter on `Document`
 * (`document.modelContext`). `navigator.modelContext` is a deprecated alias
 * retained by some builds; `window.webMCP` is a pre-standard polyfill shape.
 *
 * Resolution never throws: a host may expose `modelContext` as a throwing
 * getter, and detection failure must degrade to fallback rather than break
 * the page (Invariant 16).
 */

export type ModelContextLocation =
  'document.modelContext' | 'navigator.modelContext' | 'window.webMCP' | 'none';

export interface ModelContextHost {
  registerTool?: (tool: unknown, options?: { signal?: AbortSignal }) => unknown;
  unregisterTool?: (name: string) => unknown;
  getTools?: () => unknown;
  version?: string;
}

export interface ResolvedModelContext {
  host: ModelContextHost | null;
  location: ModelContextLocation;
  /** True when the host was found on the deprecated `navigator` alias. */
  deprecatedAlias: boolean;
  /** True when `registerTool` accepts an options bag carrying an AbortSignal. */
  supportsRegistrationOptions: boolean;
  version?: string;
  reason?: string;
}

const NOT_FOUND: ResolvedModelContext = {
  host: null,
  location: 'none',
  deprecatedAlias: false,
  supportsRegistrationOptions: false,
  reason:
    'Host exposes no WebMCP surface (document.modelContext, navigator.modelContext, window.webMCP). Fallback mode active.',
};

/** Read a property without letting a throwing getter escape. */
function safeRead(source: unknown, key: string): unknown {
  try {
    if (source === null || typeof source !== 'object') return undefined;
    return (source as Record<string, unknown>)[key];
  } catch {
    return undefined;
  }
}

function candidateAt(location: ModelContextLocation): ModelContextHost | null {
  const scope = typeof globalThis !== 'undefined' ? (globalThis as Record<string, unknown>) : null;
  if (!scope) return null;

  const raw =
    location === 'document.modelContext'
      ? safeRead(safeRead(scope, 'document'), 'modelContext')
      : location === 'navigator.modelContext'
        ? safeRead(safeRead(scope, 'navigator'), 'modelContext')
        : safeRead(scope, 'webMCP');

  if (!raw || typeof raw !== 'object') return null;
  if (typeof safeRead(raw, 'registerTool') !== 'function') return null;
  return raw as ModelContextHost;
}

/**
 * Locate the WebMCP host. Resolution order is canonical-first:
 * `document.modelContext` → `navigator.modelContext` → `window.webMCP`.
 */
export function resolveModelContext(): ResolvedModelContext {
  try {
    const order: ModelContextLocation[] = [
      'document.modelContext',
      'navigator.modelContext',
      'window.webMCP',
    ];

    for (const location of order) {
      const host = candidateAt(location);
      if (!host) continue;

      const register = host.registerTool as (...args: unknown[]) => unknown;

      // Standard hosts are specified to accept `{ signal }`. Only the
      // pre-standard polyfill shape is probed by arity, and even then the
      // options bag is still passed — surplus arguments are inert.
      const supportsRegistrationOptions =
        location === 'window.webMCP' ? register.length >= 2 : true;

      return {
        host,
        location,
        deprecatedAlias: location === 'navigator.modelContext',
        supportsRegistrationOptions,
        version: typeof host.version === 'string' ? host.version : undefined,
        reason:
          location === 'navigator.modelContext'
            ? 'Resolved via the deprecated navigator.modelContext alias. document.modelContext is canonical.'
            : undefined,
      };
    }

    return NOT_FOUND;
  } catch (err: unknown) {
    return {
      ...NOT_FOUND,
      reason: `WebMCP host resolution error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
