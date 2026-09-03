import { describe, expect, it } from 'vitest';
import { LearnedTool } from '@deputy/domain';
import { WebMCPAdapter } from '@deputy/webmcp';

function createMockTool(overrides: Partial<LearnedTool> = {}): LearnedTool {
  const now = new Date();
  return {
    toolId: 'tool_test_001',
    name: 'test_action_tool',
    description: 'A mock learned tool for testing',
    version: 1,
    inputSchema: {
      type: 'object',
      properties: { customerId: { type: 'string' } },
      required: ['customerId'],
      additionalProperties: false,
    },
    executionBinding: {
      type: 'APPLICATION_ACTION',
      actionId: 'customer.create',
      actionVersion: 1,
    },
    sourceDemonstrations: ['demo_1'],
    demonstrationCount: 2,
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
      contentId: 'cid_mock',
    },
    originRestrictions: [],
    ...overrides,
  };
}

describe('WebMCP Dynamic Registration & Lifecycle (Tests 1–8)', () => {
  // Test 1: WebMCP unavailable does not crash
  it('Test 1: WebMCP unavailable in host does not crash adapter', () => {
    const adapter = new WebMCPAdapter();
    expect(adapter).toBeDefined();
    expect(adapter.getCapabilities()).toBeDefined();
  });

  // Test 2: Dynamic tool registration works
  it('Test 2: Dynamically registers active LearnedTool into WebMCP surface', () => {
    const adapter = new WebMCPAdapter();
    const tool = createMockTool();

    const descriptor = adapter.registerTool(tool, async params => ({ processed: true, params }));
    expect(descriptor.name).toBe('test_action_tool');
    expect(descriptor.description).toBe(tool.description);
    expect(adapter.hasTool(tool.toolId)).toBe(true);
    expect(adapter.listRegisteredTools().length).toBe(1);
  });

  // Test 3: Dynamic tool registration uses persisted LearnedTool
  it('Test 3: WebMCP tool descriptor parameters derive strictly from LearnedTool', () => {
    const adapter = new WebMCPAdapter();
    const tool = createMockTool({
      name: 'dynamic_learned_capability',
      inputSchema: {
        type: 'object',
        properties: { customParam: { type: 'number' } },
        required: ['customParam'],
        additionalProperties: false,
      },
    });

    const descriptor = adapter.registerTool(tool, async () => ({ status: 'OK' }));
    expect(descriptor.name).toBe('dynamic_learned_capability');
    expect(descriptor.parameters).toEqual(tool.inputSchema);
    expect(descriptor.annotations?.version).toBe(1);
    expect(descriptor.annotations?.riskLevel).toBe('LOW');
  });

  // Test 4: Tool lifecycle retirement removes capability
  it('Test 4: Retiring a tool removes it from active WebMCP registrations', () => {
    const adapter = new WebMCPAdapter();
    const tool = createMockTool();

    adapter.registerTool(tool, async () => ({ status: 'OK' }));
    expect(adapter.hasTool(tool.toolId)).toBe(true);

    const retired = adapter.retireTool(tool.toolId, 'Security decommission');
    expect(retired).toBe(true);
    expect(adapter.hasTool(tool.toolId)).toBe(false);
    expect(adapter.listRegisteredTools().length).toBe(0);
  });

  // Test 5: Toolchange is emitted on registration and retirement
  it('Test 5: Emits toolchange events on register, retire, and update', () => {
    const adapter = new WebMCPAdapter();
    const tool = createMockTool();
    const events: string[] = [];

    adapter.onToolChange(evt => {
      events.push(`${evt.action}:${evt.toolId}`);
    });

    adapter.registerTool(tool, async () => ({}));
    adapter.retireTool(tool.toolId);

    expect(events).toEqual([`REGISTERED:${tool.toolId}`, `RETIRED:${tool.toolId}`]);
  });

  // Test 6: In-flight execution receives abort signal on retirement
  it('Test 6: In-flight execution is aborted when tool is retired', async () => {
    const adapter = new WebMCPAdapter();
    const tool = createMockTool();

    let wasAborted = false;
    const descriptor = adapter.registerTool(tool, async (_params, signal) => {
      return new Promise(resolve => {
        signal?.addEventListener('abort', () => {
          wasAborted = true;
          resolve({ aborted: true });
        });
      });
    });

    // Start execution
    const execPromise = descriptor.execute({ customerId: 'c1' });

    // Retire tool while execution is in-flight
    adapter.retireTool(tool.toolId, 'Immediate decommissioning');

    await execPromise;
    expect(wasAborted).toBe(true);
  });

  // Test 7: Disabled or inactive tool cannot be registered
  it('Test 7: Rejects registration of non-ACTIVE tool', () => {
    const adapter = new WebMCPAdapter();
    const draftTool = createMockTool({ status: 'DRAFT' });

    expect(() => adapter.registerTool(draftTool, async () => ({}))).toThrow(/Tool must be ACTIVE/);
  });

  // Test 8: Retired tool cannot execute and returns structured refusal
  it('Test 8: Inactive or retired tool refuses invocation with structured refusal', async () => {
    const adapter = new WebMCPAdapter();
    const tool = createMockTool();

    const descriptor = adapter.registerTool(tool, async () => ({ success: true }));

    // Retire tool
    adapter.retireTool(tool.toolId);

    // Attempt execution
    const result = (await descriptor.execute({ customerId: 'c1' })) as {
      refusal: boolean;
      code: string;
      reason: string;
    };

    expect(result.refusal).toBe(true);
    expect(result.code).toBe('TOOL_RETIRED');
    expect(result.reason).toContain('retired');
  });
});
