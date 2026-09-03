import { describe, expect, it, vi } from 'vitest';
import { LearnedTool } from '@deputy/domain';
import { WebMCPAdapter } from '@deputy/webmcp';

describe('WebMCP Failure Modes, Abort Signals & Lifecycle Safety', () => {
  const sampleTool: LearnedTool = {
    toolId: 'tool_test_webmcp',
    name: 'test_webmcp_tool',
    description: 'Test WebMCP tool lifecycle',
    version: 1,
    inputSchema: { type: 'object' },
    executionBinding: {
      type: 'APPLICATION_ACTION',
      actionId: 'test.action',
      actionVersion: 1,
    },
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
    createdAt: new Date(),
    updatedAt: new Date(),
    provenance: {
      source: 'test',
      origin: 'http://localhost:5173',
      trustClass: 'FIRST_PARTY',
      retrievedAt: new Date(),
      contentId: 'c1',
    },
    originRestrictions: [],
  };

  it('operates safely when host WebMCP environment is absent (Node/SSR/Mock)', () => {
    const adapter = new WebMCPAdapter();
    expect(adapter.isAvailable()).toBe(false);

    // Registering should succeed in internal map without throwing
    const registered = adapter.registerTool(sampleTool, async () => ({ status: 'ok' }));
    expect(registered).toBeDefined();
    expect(registered.name).toBe(sampleTool.name);
    expect(adapter.getRegisteredTools()).toHaveLength(1);
  });

  it('triggers abort signal on active in-flight executions upon tool retirement', async () => {
    const adapter = new WebMCPAdapter();
    let executionAborted = false;

    // Register long-running tool
    adapter.registerTool(sampleTool, async (_params, signal) => {
      return new Promise((resolve, reject) => {
        signal?.addEventListener('abort', () => {
          executionAborted = true;
          reject(new Error('Tool execution aborted due to capability retirement.'));
        });
        setTimeout(() => resolve({ done: true }), 1000);
      });
    });

    // Start execution in background
    const execPromise = adapter.executeTool('tool_test_webmcp', {});

    // Small delay, then retire tool while in flight
    await new Promise(r => setTimeout(r, 20));
    adapter.retireTool('tool_test_webmcp', 'Security vulnerability discovered');

    await expect(execPromise).rejects.toThrow(/aborted/);
    expect(executionAborted).toBe(true);
  });

  it('rejects execution of retired or unregistered tools fail-closed', async () => {
    const adapter = new WebMCPAdapter();
    adapter.registerTool(sampleTool, async () => ({ status: 'ok' }));
    adapter.retireTool('tool_test_webmcp');

    await expect(adapter.executeTool('tool_test_webmcp', {})).rejects.toThrow(/RETIRED|not active/);
  });

  it('emits toolchange event upon tool registration and unregistration', () => {
    const adapter = new WebMCPAdapter();
    const changeListener = vi.fn();
    adapter.addEventListener('toolchange', changeListener);

    adapter.registerTool(sampleTool, async () => ({}));
    expect(changeListener).toHaveBeenCalledTimes(1);

    adapter.unregisterTool('tool_test_webmcp');
    expect(changeListener).toHaveBeenCalledTimes(2);
  });
});
