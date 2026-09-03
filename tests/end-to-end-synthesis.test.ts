import { describe, expect, it } from 'vitest';
import { ActionRegistry } from '@deputy/database';
import {
  CompositeActionBinding,
  Demonstration,
  SemanticAction,
  ToolProposal,
} from '@deputy/domain';
import { ToolExecutor } from '@deputy/security';
import { ToolSynthesisEngine } from '@deputy/synthesis';

describe('Prompt 2 Section 38: End-to-End Multi-Action Synthesis Scenario', () => {
  it('Learns create_customer_with_invoice from Alice and Bob, then executes for Charlie', async () => {
    const registry = new ActionRegistry();
    const synthesisEngine = new ToolSynthesisEngine();
    const toolExecutor = new ToolExecutor(registry);
    const now = new Date();

    // 1. Build Demonstration 1 (Alice)
    const demo1Actions: SemanticAction[] = [
      {
        actionId: 'act_alice_cust',
        actionType: 'customer.create',
        actionVersion: 1,
        arguments: {
          name: 'Alice',
          email: 'alice@example.com',
          currency: 'INR',
          requestId: 'req_alice_01',
          timestamp: '2026-09-01T10:00:00Z',
        },
        actor: { id: 'admin_1', type: 'HUMAN', role: 'lead' },
        timestamp: now,
        sessionId: 'sess_alice',
        demonstrationId: 'demo_alice',
        sideEffects: ['Created customer'],
        reversibility: 'COMPENSATABLE',
        provenance: {
          source: 'operations.console',
          origin: 'http://localhost:5173',
          trustClass: 'FIRST_PARTY',
          retrievedAt: now,
          contentId: 'cid_alice_1',
        },
        correlationId: 'corr_alice_1',
      },
      {
        actionId: 'act_alice_inv',
        actionType: 'invoice.create',
        actionVersion: 1,
        arguments: {
          customerId: 'cust_alice',
          amount: 2500,
          currency: 'INR',
          requestId: 'req_alice_02',
          timestamp: '2026-09-01T10:02:00Z',
        },
        actor: { id: 'admin_1', type: 'HUMAN', role: 'lead' },
        timestamp: now,
        sessionId: 'sess_alice',
        demonstrationId: 'demo_alice',
        sideEffects: ['Created invoice'],
        reversibility: 'COMPENSATABLE',
        provenance: {
          source: 'operations.console',
          origin: 'http://localhost:5173',
          trustClass: 'FIRST_PARTY',
          retrievedAt: now,
          contentId: 'cid_alice_2',
        },
        correlationId: 'corr_alice_2',
      },
    ];

    const demoAlice: Demonstration = {
      demonstrationId: 'demo_alice',
      sessionId: 'sess_alice',
      actorId: 'admin_1',
      startedAt: now,
      status: 'COMPLETED',
      applicationContext: { environment: 'ops', appVersion: '2.0' },
      actions: demo1Actions,
      metadata: {},
    };

    // 2. Build Demonstration 2 (Bob)
    const demo2Actions: SemanticAction[] = [
      {
        actionId: 'act_bob_cust',
        actionType: 'customer.create',
        actionVersion: 1,
        arguments: {
          name: 'Bob',
          email: 'bob@example.com',
          currency: 'INR',
          requestId: 'req_bob_01',
          timestamp: '2026-09-01T11:00:00Z',
        },
        actor: { id: 'admin_1', type: 'HUMAN', role: 'lead' },
        timestamp: now,
        sessionId: 'sess_bob',
        demonstrationId: 'demo_bob',
        sideEffects: ['Created customer'],
        reversibility: 'COMPENSATABLE',
        provenance: {
          source: 'operations.console',
          origin: 'http://localhost:5173',
          trustClass: 'FIRST_PARTY',
          retrievedAt: now,
          contentId: 'cid_bob_1',
        },
        correlationId: 'corr_bob_1',
      },
      {
        actionId: 'act_bob_inv',
        actionType: 'invoice.create',
        actionVersion: 1,
        arguments: {
          customerId: 'cust_bob',
          amount: 4200,
          currency: 'INR',
          requestId: 'req_bob_02',
          timestamp: '2026-09-01T11:02:00Z',
        },
        actor: { id: 'admin_1', type: 'HUMAN', role: 'lead' },
        timestamp: now,
        sessionId: 'sess_bob',
        demonstrationId: 'demo_bob',
        sideEffects: ['Created invoice'],
        reversibility: 'COMPENSATABLE',
        provenance: {
          source: 'operations.console',
          origin: 'http://localhost:5173',
          trustClass: 'FIRST_PARTY',
          retrievedAt: now,
          contentId: 'cid_bob_2',
        },
        correlationId: 'corr_bob_2',
      },
    ];

    const demoBob: Demonstration = {
      demonstrationId: 'demo_bob',
      sessionId: 'sess_bob',
      actorId: 'admin_1',
      startedAt: now,
      status: 'COMPLETED',
      applicationContext: { environment: 'ops', appVersion: '2.0' },
      actions: demo2Actions,
      metadata: {},
    };

    // 3. Synthesize Tool Candidate
    const synthesisResult = synthesisEngine.synthesize([demoAlice, demoBob], registry, {
      toolNameOverride: 'create_customer_with_invoice',
      descriptionOverride: 'Creates a customer record and issues an initial billable invoice.',
    });

    const { candidateTool, report } = synthesisResult;

    // Verify Inferred Parameters
    const paramNames = report.inferredParameters.map(p => p.parameterName);
    expect(paramNames).toContain('customerName');
    expect(paramNames).toContain('customerEmail');
    expect(paramNames).toContain('invoiceAmount');

    // Verify Stable Metadata detected
    expect(report.stableConstants['customer.create.currency']).toBe('INR');
    expect(report.stableConstants['invoice.create.currency']).toBe('INR');

    // Verify Ignored Volatile Metadata
    expect(paramNames).not.toContain('requestId');
    expect(paramNames).not.toContain('timestamp');

    // Verify Multi-Action Binding
    expect(candidateTool.executionBinding.type).toBe('COMPOSITE_ACTION');
    const composite = candidateTool.executionBinding as CompositeActionBinding;
    expect(composite.actions.length).toBe(2);
    expect(composite.actions[0]?.actionId).toBe('customer.create');
    expect(composite.actions[1]?.actionId).toBe('invoice.create');

    // 4. Human Approval and Activation
    candidateTool.status = 'ACTIVE';
    // Allow autonomous execution for this test
    candidateTool.riskLevel = 'MEDIUM';
    candidateTool.approvalPolicy.requiresHumanAuthorization = false;

    // 5. Execute with new customer: Charlie
    const proposal: ToolProposal = {
      proposalId: 'prop_charlie_001',
      toolId: candidateTool.toolId,
      toolVersion: candidateTool.version,
      arguments: {
        customerName: 'Charlie',
        customerEmail: 'charlie@example.com',
        invoiceAmount: 5000,
      },
      requestId: 'req_charlie_e2e',
      proposedBy: { agentId: 'lead_autonomous_agent', origin: 'local' },
      timestamp: new Date(),
    };

    const executionResult = await toolExecutor.execute(proposal, candidateTool);

    // 6. Verify Exact Authorized Execution
    expect(executionResult.success).toBe(true);
    expect(executionResult.output).toBeDefined();

    const output = executionResult.output as {
      completedActions: {
        actionId: string;
        stepOrder: number;
        result: {
          name?: string;
          email?: string;
          status?: string;
          customerId?: string;
          amount?: number;
        };
      }[];
    };
    expect(output.completedActions.length).toBe(2);

    // First action created Charlie
    const step1Result = output.completedActions[0]?.result;
    expect(step1Result?.name).toBe('Charlie');
    expect(step1Result?.email).toBe('charlie@example.com');
    expect(step1Result?.status).toBe('CREATED');
    expect(step1Result?.customerId).toBeDefined();

    // Second action created Charlie's invoice using generated customerId
    const step2Result = output.completedActions[1]?.result;
    expect(step2Result?.amount).toBe(5000);
    expect(step2Result?.status).toBe('ISSUED');
    expect(step2Result?.customerId).toBe(step1Result?.customerId);
  });
});
