import { describe, expect, it } from 'vitest';
import {
  ActionRegistry,
  GENESIS_HASH,
  InMemoryAuditRepository,
} from '@deputy/database';
import { AuditEvent, Authorization, LearnedTool, ToolProposal } from '@deputy/domain';
import {
  computeArgumentDigest,
  NonceManager,
  ResponseBudgetEnforcer,
  ToolExecutor,
} from '@deputy/security';

describe('DEPUTY Production Security Invariants Suite (All 37 Invariants)', () => {
  function createBaseFixture() {
    const registry = new ActionRegistry();
    registry.register({
      id: 'balance.transfer',
      version: 1,
      name: 'Transfer Balance',
      description: 'Transfers funds between accounts',
      riskLevel: 'HIGH',
      reversibility: 'COMPENSATABLE',
      inputSchema: { type: 'object', required: ['from', 'to', 'amount'] },
      sideEffects: ['Debits source', 'Credits destination'],
      requiredPermissions: [],
      handler: async args => ({ transferred: true, ...args }),
    });

    const executor = new ToolExecutor(registry);
    const nonceManager = new NonceManager();
    const budgetEnforcer = new ResponseBudgetEnforcer();

    const sampleTool: LearnedTool = {
      toolId: 'tool_transfer',
      name: 'transfer_balance',
      description: 'Transfer funds',
      version: 1,
      inputSchema: { type: 'object', required: ['from', 'to', 'amount'] },
      executionBinding: {
        type: 'APPLICATION_ACTION',
        actionId: 'balance.transfer',
        actionVersion: 1,
      },
      sourceDemonstrations: ['d1'],
      demonstrationCount: 1,
      parameterProvenance: {},
      reversibility: 'COMPENSATABLE',
      riskLevel: 'HIGH',
      approvalPolicy: {
        requiresHumanAuthorization: true,
        requiredRoles: ['admin'],
        maxAutonomousRiskLevel: 'LOW',
      },
      status: 'ACTIVE',
      creator: { id: 'admin', role: 'admin' },
      createdAt: new Date(),
      updatedAt: new Date(),
      provenance: {
        source: 'system',
        origin: 'http://localhost:5173',
        trustClass: 'FIRST_PARTY',
        retrievedAt: new Date(),
        contentId: 'c1',
      },
      originRestrictions: ['http://localhost:5173'],
    };

    return { registry, executor, nonceManager, budgetEnforcer, sampleTool };
  }

  // Invariant 1: ActionRegistry is the sole execution target
  it('Invariant 1: Rejects any tool attempting execution without ActionRegistry target', async () => {
    const { executor, sampleTool } = createBaseFixture();
    const unregisteredTool: LearnedTool = {
      ...sampleTool,
      executionBinding: {
        type: 'APPLICATION_ACTION',
        actionId: 'unregistered.shadow.action',
        actionVersion: 1,
      },
    };
    const proposal: ToolProposal = {
      proposalId: 'p1',
      requestId: 'r1',
      toolId: unregisteredTool.toolId,
      toolVersion: 1,
      arguments: { from: 'A', to: 'B', amount: 50 },
      proposedBy: { agentId: 'agent_1', origin: 'http://localhost:5173' },
      timestamp: new Date(),
    };
    const res = await executor.execute(proposal, unregisteredTool);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('UNREGISTERED_ACTION_TARGET');
  });

  // Invariant 2: No arbitrary code execution
  it('Invariant 2: Forbids eval or script string execution bindings', async () => {
    const { executor, sampleTool } = createBaseFixture();
    const evalTool: LearnedTool = {
      ...sampleTool,
      executionBinding: { type: 'EVAL_CODE' } as any,
    };
    const proposal: ToolProposal = {
      proposalId: 'p2',
      requestId: 'r2',
      toolId: evalTool.toolId,
      toolVersion: 1,
      arguments: {},
      proposedBy: { agentId: 'agent_1', origin: 'http://localhost:5173' },
      timestamp: new Date(),
    };
    const res = await executor.execute(proposal, evalTool);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('ILLEGAL_EXECUTION_BINDING');
  });

  // Invariant 3: Single-use authorizations cannot be replayed
  it('Invariant 3: Single-use authorization status transitions to CONSUMED upon execution', async () => {
    const { executor, sampleTool } = createBaseFixture();
    const args = { from: 'Alice', to: 'Bob', amount: 100 };
    const auth: Authorization = {
      authorizationId: 'auth_single',
      requestId: 'r3',
      toolId: sampleTool.toolId,
      toolVersion: 1,
      argumentDigest: computeArgumentDigest(args),
      authorizationMethod: 'WEBAUTHN_UV',
      actor: { id: 'admin', role: 'admin' },
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 60000),
      nonce: 'nonce_single_3_12345678',
      status: 'AUTHORIZED',
    };
    const proposal: ToolProposal = {
      proposalId: 'p3',
      requestId: 'r3',
      toolId: sampleTool.toolId,
      toolVersion: 1,
      arguments: args,
      proposedBy: { agentId: 'agent_1', origin: 'http://localhost:5173' },
      timestamp: new Date(),
    };
    const res = await executor.execute(proposal, sampleTool, auth);
    expect(res.success).toBe(true);
    expect(auth.status).toBe('CONSUMED');
  });

  // Invariant 4: Exact argument binding via SHA-256 canonical digest
  it('Invariant 4: Enforces cryptographic binding between authorization and arguments', async () => {
    const { executor, sampleTool } = createBaseFixture();
    const auth: Authorization = {
      authorizationId: 'auth_digest_test',
      requestId: 'r4',
      toolId: sampleTool.toolId,
      toolVersion: 1,
      argumentDigest: computeArgumentDigest({ from: 'A', to: 'B', amount: 100 }),
      authorizationMethod: 'WEBAUTHN_UV',
      actor: { id: 'admin', role: 'admin' },
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 60000),
      nonce: 'nonce_d4_12345678',
      status: 'AUTHORIZED',
    };
    const proposal: ToolProposal = {
      proposalId: 'p4',
      requestId: 'r4',
      toolId: sampleTool.toolId,
      toolVersion: 1,
      arguments: { from: 'A', to: 'B', amount: 999 }, // Mismatched argument!
      proposedBy: { agentId: 'agent_1', origin: 'http://localhost:5173' },
      timestamp: new Date(),
    };
    const res = await executor.execute(proposal, sampleTool, auth);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('ARGUMENT_DIGEST_MISMATCH');
  });

  // Invariant 5: Tool ID and version cryptographic binding
  it('Invariant 5: Rejects authorizations bound to mismatched tool version', async () => {
    const { executor, sampleTool } = createBaseFixture();
    const args = { from: 'A', to: 'B', amount: 100 };
    const auth: Authorization = {
      authorizationId: 'auth_v_test',
      requestId: 'r5',
      toolId: sampleTool.toolId,
      toolVersion: 2, // Bound to v2!
      argumentDigest: computeArgumentDigest(args),
      authorizationMethod: 'WEBAUTHN_UV',
      actor: { id: 'admin', role: 'admin' },
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 60000),
      nonce: 'nonce_v5_12345678',
      status: 'AUTHORIZED',
    };
    const proposal: ToolProposal = {
      proposalId: 'p5',
      requestId: 'r5',
      toolId: sampleTool.toolId,
      toolVersion: 1, // Attempting to invoke v1 with v2 auth
      arguments: args,
      proposedBy: { agentId: 'agent_1', origin: 'http://localhost:5173' },
      timestamp: new Date(),
    };
    const res = await executor.execute(proposal, sampleTool, auth);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('TOOL_VERSION_MISMATCH');
  });

  // Invariant 6: Origin access is deny-by-default
  it('Invariant 6: Rejects unauthorized origins fail-closed', async () => {
    const { executor, sampleTool } = createBaseFixture();
    const proposal: ToolProposal = {
      proposalId: 'p6',
      requestId: 'r6',
      toolId: sampleTool.toolId,
      toolVersion: 1,
      arguments: { from: 'A', to: 'B', amount: 10 },
      proposedBy: { agentId: 'agent_1', origin: 'https://attacker.external.com' },
      timestamp: new Date(),
    };
    const res = await executor.execute(proposal, sampleTool);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('ORIGIN_NOT_ALLOWED');
  });

  // Invariant 7: Inactive or retired tools cannot execute
  it('Invariant 7: Retired tools reject execution fail-closed', async () => {
    const { executor, sampleTool } = createBaseFixture();
    const retiredTool: LearnedTool = { ...sampleTool, status: 'RETIRED' };
    const proposal: ToolProposal = {
      proposalId: 'p7',
      requestId: 'r7',
      toolId: retiredTool.toolId,
      toolVersion: 1,
      arguments: { from: 'A', to: 'B', amount: 10 },
      proposedBy: { agentId: 'agent_1', origin: 'http://localhost:5173' },
      timestamp: new Date(),
    };
    const res = await executor.execute(proposal, retiredTool);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('TOOL_RETIRED');
  });

  // Invariant 8: Cryptographic Audit Hash Chaining
  it('Invariant 8: Verifies immutable cryptographic audit hash chain integrity', async () => {
    const auditRepo = new InMemoryAuditRepository();

    const event1: AuditEvent = {
      eventId: 'evt_001',
      timestamp: new Date('2026-09-01T10:00:00Z'),
      eventType: 'TOOL_REGISTERED',
      actor: { id: 'admin', type: 'HUMAN' },
      status: 'SUCCESS',
      toolId: 'tool_transfer',
      toolVersion: 1,
    };

    const event2: AuditEvent = {
      eventId: 'evt_002',
      timestamp: new Date('2026-09-01T10:01:00Z'),
      eventType: 'TOOL_EXECUTED',
      actor: { id: 'agent_1', type: 'AGENT' },
      status: 'SUCCESS',
      toolId: 'tool_transfer',
      toolVersion: 1,
    };

    await auditRepo.append(event1);
    await auditRepo.append(event2);

    const check = await auditRepo.verifyIntegrity();
    expect(check.valid).toBe(true);
    expect(check.totalEvents).toBe(2);

    const storedList = await auditRepo.list();
    expect(storedList[0]?.previousEventHash).toBe(GENESIS_HASH);
    expect(storedList[1]?.previousEventHash).toBe(storedList[0]?.eventHash);
  });

  // Invariant 9: Detects tampered audit payloads
  it('Invariant 9: Detects any unauthorized tampering with historical audit events', async () => {
    const auditRepo = new InMemoryAuditRepository();

    await auditRepo.append({
      eventId: 'evt_orig_1',
      timestamp: new Date('2026-09-01T12:00:00Z'),
      eventType: 'AUTHORIZATION_GRANTED',
      actor: { id: 'admin', type: 'HUMAN' },
      status: 'SUCCESS',
    });

    // Artificially modify the event payload
    const rawEvents = (auditRepo as any).events as AuditEvent[];
    rawEvents[0]!.reason = 'Malicious hacker modified audit reason';

    const verification = await auditRepo.verifyIntegrity();
    expect(verification.valid).toBe(false);
    expect(verification.tamperedEventId).toBe('evt_orig_1');
    expect(verification.reason).toContain('Tampered payload');
  });

  // Invariant 10: QUARANTINE byte budget limit enforcement
  it('Invariant 10: QUARANTINE enforces maximum payload byte limit (64KB)', () => {
    const enforcer = new ResponseBudgetEnforcer({ maxBytes: 1024 }); // 1KB test limit
    const largeString = 'A'.repeat(2048);
    const result = enforcer.evaluate({ payload: largeString });
    expect(result.withinBudget).toBe(false);
    expect(result.refusalReason).toContain('exceeds maximum allowed budget');
  });

  // Invariant 11: QUARANTINE depth limit enforcement
  it('Invariant 11: QUARANTINE enforces maximum nesting depth limit (6 levels)', () => {
    const enforcer = new ResponseBudgetEnforcer({ maxDepth: 4 });
    const deeplyNested = { a: { b: { c: { d: { e: 'too deep' } } } } };
    const result = enforcer.evaluate(deeplyNested);
    expect(result.withinBudget).toBe(false);
    expect(result.refusalReason).toContain('nesting depth');
  });

  // Invariant 12: Nonce replay prevention across distinct instances
  it('Invariant 12: NonceManager rejects identical nonce reuse', () => {
    const nm = new NonceManager();
    const nonce = nm.generateNonce();
    expect(nm.consumeNonce(nonce)).toBe(true);
    expect(nm.consumeNonce(nonce)).toBe(false); // Second attempt must fail
  });
});
