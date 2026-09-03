import { describe, expect, it } from 'vitest';
import { ActionRegistry, InMemoryAuthorizationRepository } from '@deputy/database';
import { Authorization, LearnedTool, ToolProposal } from '@deputy/domain';
import { computeArgumentDigest, ToolExecutor } from '@deputy/security';

function createMockLearnedTool(overrides: Partial<LearnedTool> = {}): LearnedTool {
  const now = new Date();
  return {
    toolId: 'tool_ops_customer',
    name: 'create_customer',
    description: 'Creates a customer',
    version: 1,
    inputSchema: { type: 'object' },
    executionBinding: {
      type: 'APPLICATION_ACTION',
      actionId: 'customer.create',
      actionVersion: 1,
    },
    sourceDemonstrations: ['d1'],
    demonstrationCount: 2,
    parameterProvenance: {},
    reversibility: 'COMPENSATABLE',
    riskLevel: 'HIGH',
    approvalPolicy: {
      requiresHumanAuthorization: true,
      requiredRoles: ['admin'],
      maxAutonomousRiskLevel: 'MEDIUM',
    },
    status: 'ACTIVE',
    creator: { id: 'u1', role: 'admin' },
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

describe('Exact Argument Binding & Concurrency Guards (Tests 21–27)', () => {
  const registry = new ActionRegistry();
  const executor = new ToolExecutor(registry);

  // Test 21: Changing one argument invalidates authorization
  it('Test 21: Changing one argument produces different digest and invalidates authorization', async () => {
    const tool = createMockLearnedTool();
    const authorizedArgs = { name: 'Charlie', email: 'charlie@example.com', amount: 2500 };
    const tamperedArgs = { name: 'Charlie', email: 'charlie@example.com', amount: 2501 };

    const digest = computeArgumentDigest(authorizedArgs);
    const auth: Authorization = {
      authorizationId: 'auth_tamper_1',
      requestId: 'req_1',
      toolId: tool.toolId,
      toolVersion: tool.version,
      argumentDigest: digest,
      authorizationMethod: 'WEBAUTHN_UV',
      actor: { id: 'usr_lead', role: 'admin' },
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 60000),
      nonce: 'nonce_1234567890123456',
      status: 'AUTHORIZED',
    };

    const proposal: ToolProposal = {
      proposalId: 'prop_tamper_1',
      toolId: tool.toolId,
      toolVersion: tool.version,
      arguments: tamperedArgs,
      requestId: 'req_1',
      proposedBy: { agentId: 'agent_1', origin: 'local' },
      timestamp: new Date(),
    };

    const result = await executor.execute(proposal, tool, auth);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('ARGUMENT_DIGEST_MISMATCH');
  });

  // Test 22: Changing nested arguments invalidates authorization
  it('Test 22: Mutating a nested argument invalidates authorization', async () => {
    const tool = createMockLearnedTool();
    const authorizedArgs = { customer: { id: 'c1', tier: 'STANDARD' } };
    const tamperedArgs = { customer: { id: 'c1', tier: 'VIP' } };

    const digest = computeArgumentDigest(authorizedArgs);
    const auth: Authorization = {
      authorizationId: 'auth_nested_1',
      requestId: 'req_nested',
      toolId: tool.toolId,
      toolVersion: tool.version,
      argumentDigest: digest,
      authorizationMethod: 'WEBAUTHN_UV',
      actor: { id: 'usr_lead', role: 'admin' },
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 60000),
      nonce: 'nonce_1234567890123456',
      status: 'AUTHORIZED',
    };

    const proposal: ToolProposal = {
      proposalId: 'prop_nested_1',
      toolId: tool.toolId,
      toolVersion: tool.version,
      arguments: tamperedArgs,
      requestId: 'req_nested',
      proposedBy: { agentId: 'agent_1', origin: 'local' },
      timestamp: new Date(),
    };

    const result = await executor.execute(proposal, tool, auth);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('ARGUMENT_DIGEST_MISMATCH');
  });

  // Test 23: Reordering JSON keys does NOT invalidate authorization
  it('Test 23: Key reordering produces identical canonical SHA-256 digest', async () => {
    const args1 = { z_last: 'foo', a_first: 'bar', m_middle: 100 };
    const args2 = { a_first: 'bar', m_middle: 100, z_last: 'foo' };

    const digest1 = computeArgumentDigest(args1);
    const digest2 = computeArgumentDigest(args2);

    expect(digest1).toBe(digest2);
  });

  // Test 24: Changing tool ID invalidates authorization
  it('Test 24: Authorization for toolA cannot authorize toolB', async () => {
    const toolA = createMockLearnedTool({ toolId: 'tool_A' });
    const toolB = createMockLearnedTool({ toolId: 'tool_B' });
    const args = { name: 'Alice' };

    const auth: Authorization = {
      authorizationId: 'auth_diff_tool',
      requestId: 'req_diff_tool',
      toolId: toolA.toolId,
      toolVersion: 1,
      argumentDigest: computeArgumentDigest(args),
      authorizationMethod: 'WEBAUTHN_UV',
      actor: { id: 'usr_lead', role: 'admin' },
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 60000),
      nonce: 'nonce_1234567890123456',
      status: 'AUTHORIZED',
    };

    const proposal: ToolProposal = {
      proposalId: 'prop_diff_tool',
      toolId: toolB.toolId,
      toolVersion: 1,
      arguments: args,
      requestId: 'req_diff_tool',
      proposedBy: { agentId: 'agent_1', origin: 'local' },
      timestamp: new Date(),
    };

    const result = await executor.execute(proposal, toolB, auth);
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('does not match target tool ID');
  });

  // Test 25: Changing tool version invalidates authorization
  it('Test 25: Authorization for tool v1 cannot authorize tool v2', async () => {
    const toolV2 = createMockLearnedTool({ version: 2 });
    const args = { name: 'Alice' };

    const auth: Authorization = {
      authorizationId: 'auth_v1',
      requestId: 'req_v1',
      toolId: toolV2.toolId,
      toolVersion: 1, // Authorized for v1
      argumentDigest: computeArgumentDigest(args),
      authorizationMethod: 'WEBAUTHN_UV',
      actor: { id: 'usr_lead', role: 'admin' },
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 60000),
      nonce: 'nonce_1234567890123456',
      status: 'AUTHORIZED',
    };

    const proposal: ToolProposal = {
      proposalId: 'prop_v2',
      toolId: toolV2.toolId,
      toolVersion: 2, // Invoking v2
      arguments: args,
      requestId: 'req_v1',
      proposedBy: { agentId: 'agent_1', origin: 'local' },
      timestamp: new Date(),
    };

    const result = await executor.execute(proposal, toolV2, auth);
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('does not match target tool version');
  });

  // Test 26: Concurrent consumers result in exactly one execution
  it('Test 26: Two simultaneous authorization consumers result in exactly 1 execution and 1 failure', async () => {
    const authRepo = new InMemoryAuthorizationRepository();
    const digest = computeArgumentDigest({ name: 'Bob' });

    const auth: Authorization = {
      authorizationId: 'auth_concurrent_01',
      requestId: 'req_conc_01',
      toolId: 'tool_test',
      toolVersion: 1,
      argumentDigest: digest,
      authorizationMethod: 'WEBAUTHN_UV',
      actor: { id: 'usr_lead', role: 'admin' },
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 60000),
      nonce: 'nonce_1234567890123456',
      status: 'AUTHORIZED',
    };

    await authRepo.create(auth);

    // Launch two simultaneous consumption requests
    const p1 = authRepo.consume(auth.authorizationId, 'prop_1', digest);
    const p2 = authRepo.consume(auth.authorizationId, 'prop_2', digest);

    const outcomes = await Promise.allSettled([p1, p2]);
    const successes = outcomes.filter(o => o.status === 'fulfilled');
    const failures = outcomes.filter(o => o.status === 'rejected');

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);
  });

  // Test 27: Repeated execution attempts fail after consumption
  it('Test 27: Reused authorization fails immediately with ALREADY_CONSUMED in ToolExecutor', async () => {
    const tool = createMockLearnedTool();
    const args = { name: 'Alice', email: 'alice@example.com' };
    const digest = computeArgumentDigest(args);

    const auth: Authorization = {
      authorizationId: 'auth_replay_guard',
      requestId: 'req_replay_1',
      toolId: tool.toolId,
      toolVersion: tool.version,
      argumentDigest: digest,
      authorizationMethod: 'WEBAUTHN_UV',
      actor: { id: 'usr_lead', role: 'admin' },
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 60000),
      nonce: 'nonce_1234567890123456',
      status: 'AUTHORIZED',
    };

    const proposal: ToolProposal = {
      proposalId: 'prop_replay_1',
      toolId: tool.toolId,
      toolVersion: tool.version,
      arguments: args,
      requestId: 'req_replay_1',
      proposedBy: { agentId: 'agent_1', origin: 'local' },
      timestamp: new Date(),
    };

    // 1st Execution: Succeeds and marks authorization as CONSUMED
    const result1 = await executor.execute(proposal, tool, auth);
    expect(result1.success).toBe(true);
    expect(auth.status).toBe('CONSUMED');

    // 2nd Execution with same authorization: Fails with ALREADY_CONSUMED
    const proposal2: ToolProposal = {
      ...proposal,
      proposalId: 'prop_replay_2',
    };
    const result2 = await executor.execute(proposal2, tool, auth);
    expect(result2.success).toBe(false);
    expect(result2.error?.code).toBe('ALREADY_CONSUMED');
  });
});
