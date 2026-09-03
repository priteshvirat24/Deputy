import { afterEach, describe, expect, it, vi } from 'vitest';
import { LearnedTool } from '@deputy/domain';
import { WebMCPAdapter, deriveBehaviourHints, resolveModelContext } from '@deputy/webmcp';

/**
 * These tests exercise the code path that only fires when a WebMCP host is
 * actually present. The pre-existing suites run in bare Node (no host), so they
 * validate the fallback branch but never the propagation to a host — which is
 * exactly why the deprecated-API regression went unnoticed. Here we install
 * mock hosts on globalThis and assert resolution order, signal handoff, and
 * abort-based removal.
 */

type RegisterCall = { def: unknown; options?: { signal?: AbortSignal } };

interface MockHost {
  registerTool: (def: unknown, options?: { signal?: AbortSignal }) => void;
  unregisterTool?: (name: string) => void;
  registerCalls: RegisterCall[];
  unregisterCalls: string[];
}

/** A standard host whose registerTool accepts the `{ signal }` options bag. */
function makeStandardHost(): MockHost {
  const host: MockHost = {
    registerCalls: [],
    unregisterCalls: [],
    registerTool(def, options) {
      host.registerCalls.push({ def, options });
    },
    unregisterTool(name) {
      host.unregisterCalls.push(name);
    },
  };
  return host;
}

/**
 * A legacy polyfill: registerTool takes a single positional argument (arity 1),
 * signalling it cannot observe an abort signal, so removal must fall back to
 * unregisterTool.
 */
function makeLegacyPolyfill(): MockHost {
  const host: MockHost = {
    registerCalls: [],
    unregisterCalls: [],
    registerTool(def: unknown) {
      host.registerCalls.push({ def });
    },
    unregisterTool(name) {
      host.unregisterCalls.push(name);
    },
  };
  return host;
}

// `navigator` is a read-only getter in the vitest node environment, so install
// hosts via vi.stubGlobal (which swaps globals safely) rather than assignment.
function setHost(name: 'document' | 'navigator' | 'webMCP', value: unknown): void {
  vi.stubGlobal(name, value);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function createMockTool(overrides: Partial<LearnedTool> = {}): LearnedTool {
  const now = new Date();
  return {
    toolId: 'tool_host_bind',
    name: 'host_bound_tool',
    description: 'Tool for host binding tests',
    version: 1,
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    executionBinding: { type: 'APPLICATION_ACTION', actionId: 'x.y', actionVersion: 1 },
    sourceDemonstrations: ['d1'],
    demonstrationCount: 1,
    parameterProvenance: {},
    reversibility: 'REVERSIBLE',
    riskLevel: 'LOW',
    approvalPolicy: {
      requiresHumanAuthorization: false,
      requiredRoles: [],
      maxAutonomousRiskLevel: 'MEDIUM',
    },
    status: 'ACTIVE',
    creator: { id: 'usr_1', role: 'admin' },
    createdAt: now,
    updatedAt: now,
    provenance: {
      source: 'test',
      origin: 'http://localhost:5173',
      trustClass: 'FIRST_PARTY',
      retrievedAt: now,
      contentId: 'c1',
    },
    originRestrictions: [],
    ...overrides,
  };
}

describe('resolveModelContext — resolution order & robustness', () => {
  it('prefers document.modelContext over the navigator alias and window.webMCP', () => {
    const doc = makeStandardHost();
    const nav = makeStandardHost();
    const win = makeStandardHost();
    setHost('document', { modelContext: doc });
    setHost('navigator', { modelContext: nav });
    setHost('webMCP', win);

    const resolved = resolveModelContext();
    expect(resolved.location).toBe('document.modelContext');
    expect(resolved.deprecatedAlias).toBe(false);
    expect(resolved.host).toBe(doc);
  });

  it('falls back to navigator.modelContext and flags it deprecated', () => {
    const nav = makeStandardHost();
    setHost('navigator', { modelContext: nav });

    const resolved = resolveModelContext();
    expect(resolved.location).toBe('navigator.modelContext');
    expect(resolved.deprecatedAlias).toBe(true);
    expect(resolved.reason).toMatch(/deprecated/i);
  });

  it('falls back to window.webMCP last', () => {
    setHost('webMCP', makeStandardHost());
    const resolved = resolveModelContext();
    expect(resolved.location).toBe('window.webMCP');
  });

  it('reports none when no host is present', () => {
    const resolved = resolveModelContext();
    expect(resolved.location).toBe('none');
    expect(resolved.host).toBeNull();
  });

  it('never throws when the modelContext getter itself throws — degrades to fallback', () => {
    const hostile = {};
    Object.defineProperty(hostile, 'modelContext', {
      configurable: true,
      get() {
        throw new Error('hostile getter');
      },
    });
    setHost('document', hostile);

    let resolved: ReturnType<typeof resolveModelContext> | undefined;
    expect(() => {
      resolved = resolveModelContext();
    }).not.toThrow();
    expect(resolved?.host).toBeNull();
  });

  it('ignores a modelContext without a registerTool function', () => {
    setHost('document', { modelContext: { getTools: () => [] } });
    expect(resolveModelContext().location).toBe('none');
  });

  it('marks a standard host as supporting registration options', () => {
    setHost('document', { modelContext: makeStandardHost() });
    expect(resolveModelContext().supportsRegistrationOptions).toBe(true);
  });

  it('marks a single-arg legacy polyfill as not supporting options', () => {
    setHost('webMCP', makeLegacyPolyfill());
    const resolved = resolveModelContext();
    expect(resolved.location).toBe('window.webMCP');
    expect(resolved.supportsRegistrationOptions).toBe(false);
  });
});

describe('WebMCPAdapter — signal handoff to a standard host', () => {
  it('passes the per-tool AbortSignal into registerTool options', () => {
    const host = makeStandardHost();
    setHost('document', { modelContext: host });

    const adapter = new WebMCPAdapter();
    adapter.registerTool(createMockTool(), async () => ({ ok: true }));

    expect(host.registerCalls).toHaveLength(1);
    const signal = host.registerCalls[0]?.options?.signal;
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal?.aborted).toBe(false);
  });

  it('aborts the signal handed to the host when the tool is retired', () => {
    const host = makeStandardHost();
    setHost('document', { modelContext: host });

    const adapter = new WebMCPAdapter();
    const tool = createMockTool();
    adapter.registerTool(tool, async () => ({ ok: true }));
    const signal = host.registerCalls[0]?.options?.signal;

    adapter.retireTool(tool.toolId, 'retired in test');

    expect(signal?.aborted).toBe(true);
    // Standard host observes removal via the aborted signal — no unregisterTool.
    expect(host.unregisterCalls).toHaveLength(0);
  });

  it('records the resolved host location on the registration', () => {
    setHost('navigator', { modelContext: makeStandardHost() });
    const adapter = new WebMCPAdapter();
    const caps = adapter.getCapabilities();
    expect(caps.available).toBe(true);
    expect(caps.location).toBe('navigator.modelContext');
    expect(caps.deprecatedAlias).toBe(true);
  });
});

describe('WebMCPAdapter — abort-based removal vs legacy fallback', () => {
  it('calls unregisterTool as a fallback for a legacy polyfill that cannot take a signal', () => {
    const host = makeLegacyPolyfill();
    setHost('webMCP', host);

    const adapter = new WebMCPAdapter();
    const tool = createMockTool();
    adapter.registerTool(tool, async () => ({ ok: true }));

    // Legacy host was called positionally (no options bag).
    expect(host.registerCalls[0]?.options).toBeUndefined();

    adapter.retireTool(tool.toolId);
    expect(host.unregisterCalls).toEqual([tool.name]);
  });

  it('does not throw if the host registration itself throws', () => {
    setHost('document', {
      modelContext: {
        registerTool() {
          throw new Error('host rejected');
        },
      },
    });
    const adapter = new WebMCPAdapter();
    expect(() => adapter.registerTool(createMockTool(), async () => ({}))).not.toThrow();
    // Internal registration still succeeds even when the host rejects.
    expect(adapter.hasTool('tool_host_bind')).toBe(true);
  });
});

describe('deriveBehaviourHints — advisory MCP hints from reversibility', () => {
  it('never claims read-only, for any reversibility class', () => {
    for (const r of ['REVERSIBLE', 'COMPENSATABLE', 'IRREVERSIBLE'] as const) {
      expect(deriveBehaviourHints(r).readOnlyHint).toBe(false);
    }
  });

  it('marks IRREVERSIBLE and COMPENSATABLE as destructive, REVERSIBLE as not', () => {
    expect(deriveBehaviourHints('REVERSIBLE').destructiveHint).toBe(false);
    expect(deriveBehaviourHints('COMPENSATABLE').destructiveHint).toBe(true);
    expect(deriveBehaviourHints('IRREVERSIBLE').destructiveHint).toBe(true);
  });

  it('declines to assert idempotence (omits the hint)', () => {
    expect('idempotentHint' in deriveBehaviourHints('REVERSIBLE')).toBe(false);
  });

  it('surfaces the derived hints on a registered descriptor', () => {
    const adapter = new WebMCPAdapter();
    const descriptor = adapter.registerTool(
      createMockTool({ reversibility: 'IRREVERSIBLE' }),
      async () => ({}),
    );
    expect(descriptor.annotations?.readOnlyHint).toBe(false);
    expect(descriptor.annotations?.destructiveHint).toBe(true);
    expect(descriptor.inputSchema).toBeDefined();
  });
});
