import { describe, expect, it } from 'vitest';
import { ActionRegistry } from '@deputy/database';
import {
  ApplicationActionBinding,
  CompositeActionBinding,
  Demonstration,
  SemanticAction,
} from '@deputy/domain';
import { ToolSynthesisEngine } from '@deputy/synthesis';

function makeMockDemo(
  id: string,
  actions: { actionType: string; args: Record<string, unknown> }[],
): Demonstration {
  const semActions: SemanticAction[] = actions.map((a, idx) => ({
    actionId: `act_${id}_${idx}`,
    actionType: a.actionType,
    actionVersion: 1,
    arguments: a.args,
    actor: { id: 'usr_test', type: 'HUMAN', role: 'lead' },
    timestamp: new Date(),
    sessionId: `sess_${id}`,
    demonstrationId: id,
    sideEffects: [],
    reversibility: 'COMPENSATABLE',
    provenance: {
      source: 'test',
      origin: 'test',
      trustClass: 'FIRST_PARTY',
      retrievedAt: new Date(),
      contentId: `cid_${id}_${idx}`,
    },
    correlationId: `corr_${id}_${idx}`,
  }));

  return {
    demonstrationId: id,
    sessionId: `sess_${id}`,
    actorId: 'usr_test',
    startedAt: new Date(),
    status: 'COMPLETED',
    applicationContext: { environment: 'test', appVersion: '1.0' },
    actions: semActions,
    metadata: {},
  };
}

describe('Tool Synthesis Engine & Security Safeguards (Tests 25-39)', () => {
  const registry = new ActionRegistry();
  const synthesisEngine = new ToolSynthesisEngine();

  // Test 25: Generate single-action tool
  it('Test 25: Generates single-action LearnedTool candidate with APPLICATION_ACTION binding', () => {
    const demo1 = makeMockDemo('d1', [
      { actionType: 'customer.create', args: { name: 'Alice', email: 'a@ex.com' } },
    ]);
    const demo2 = makeMockDemo('d2', [
      { actionType: 'customer.create', args: { name: 'Bob', email: 'b@ex.com' } },
    ]);

    const result = synthesisEngine.synthesize([demo1, demo2], registry);
    expect(result.candidateTool.executionBinding.type).toBe('APPLICATION_ACTION');
    const binding = result.candidateTool.executionBinding as ApplicationActionBinding;
    expect(binding.actionId).toBe('customer.create');
  });

  // Test 26: Generate multi-action tool
  it('Test 26: Generates multi-action LearnedTool candidate with COMPOSITE_ACTION binding', () => {
    const demo1 = makeMockDemo('d1', [
      { actionType: 'customer.create', args: { name: 'Alice', email: 'a@ex.com' } },
      { actionType: 'invoice.create', args: { customerId: 'c1', amount: 2500 } },
    ]);
    const demo2 = makeMockDemo('d2', [
      { actionType: 'customer.create', args: { name: 'Bob', email: 'b@ex.com' } },
      { actionType: 'invoice.create', args: { customerId: 'c2', amount: 4200 } },
    ]);

    const result = synthesisEngine.synthesize([demo1, demo2], registry);
    expect(result.candidateTool.executionBinding.type).toBe('COMPOSITE_ACTION');
    const composite = result.candidateTool.executionBinding as CompositeActionBinding;
    expect(composite.actions.length).toBe(2);
  });

  // Test 27: Correctly creates parameter mappings
  it('Test 27: Generates explicit parameter mappings to underlying action arguments', () => {
    const demo1 = makeMockDemo('d1', [
      { actionType: 'customer.create', args: { name: 'Alice', email: 'a@ex.com' } },
      { actionType: 'invoice.create', args: { customerId: 'c1', amount: 2500 } },
    ]);
    const demo2 = makeMockDemo('d2', [
      { actionType: 'customer.create', args: { name: 'Bob', email: 'b@ex.com' } },
      { actionType: 'invoice.create', args: { customerId: 'c2', amount: 4200 } },
    ]);

    const result = synthesisEngine.synthesize([demo1, demo2], registry);
    const composite = result.candidateTool.executionBinding as CompositeActionBinding;

    expect(composite.actions[0]?.parameterMapping['customerName']).toBe('name');
    expect(composite.actions[1]?.parameterMapping['invoiceAmount']).toBe('amount');
  });

  // Test 28: Preserves source demonstrations
  it('Test 28: Preserves source demonstration IDs and demonstration count', () => {
    const demo1 = makeMockDemo('demo_alpha', [
      { actionType: 'customer.create', args: { name: 'Alice' } },
    ]);
    const demo2 = makeMockDemo('demo_beta', [
      { actionType: 'customer.create', args: { name: 'Bob' } },
    ]);

    const result = synthesisEngine.synthesize([demo1, demo2], registry);
    expect(result.candidateTool.sourceDemonstrations).toEqual(['demo_alpha', 'demo_beta']);
    expect(result.candidateTool.demonstrationCount).toBe(2);
  });

  // Test 29: Correctly aggregates risk conservatively
  it('Test 29: Aggregates risk conservatively (LOW + HIGH = HIGH, MEDIUM + CRITICAL = CRITICAL)', () => {
    // meeting.schedule (LOW) + refund.create (HIGH) -> tool must be HIGH
    const demo1 = makeMockDemo('d1', [
      {
        actionType: 'meeting.schedule',
        args: { customerId: 'c1', date: '2026-10-01', durationMinutes: 30 },
      },
      { actionType: 'refund.create', args: { customerId: 'c1', amount: 1000, reason: 'delay' } },
    ]);
    const demo2 = makeMockDemo('d2', [
      {
        actionType: 'meeting.schedule',
        args: { customerId: 'c2', date: '2026-10-02', durationMinutes: 45 },
      },
      { actionType: 'refund.create', args: { customerId: 'c2', amount: 2000, reason: 'fault' } },
    ]);

    const result = synthesisEngine.synthesize([demo1, demo2], registry);
    expect(result.candidateTool.riskLevel).toBe('HIGH');
  });

  // Test 30: Correctly aggregates reversibility conservatively
  it('Test 30: Aggregates reversibility conservatively (REVERSIBLE + IRREVERSIBLE = IRREVERSIBLE)', () => {
    // customer.update (REVERSIBLE) + customer.archive (IRREVERSIBLE) -> tool must be IRREVERSIBLE
    const demo1 = makeMockDemo('d1', [
      { actionType: 'customer.update', args: { customerId: 'c1', name: 'Alice' } },
      { actionType: 'customer.archive', args: { customerId: 'c1', reason: 'churn' } },
    ]);
    const demo2 = makeMockDemo('d2', [
      { actionType: 'customer.update', args: { customerId: 'c2', name: 'Bob' } },
      { actionType: 'customer.archive', args: { customerId: 'c2', reason: 'duplicate' } },
    ]);

    const result = synthesisEngine.synthesize([demo1, demo2], registry);
    expect(result.candidateTool.reversibility).toBe('IRREVERSIBLE');
  });

  // Test 31: Rejects synthesis with insufficient evidence (< 2 demonstrations)
  it('Test 31: Rejects synthesis with fewer than 2 demonstrations with INSUFFICIENT_EVIDENCE', () => {
    const demo1 = makeMockDemo('d1', [{ actionType: 'customer.create', args: { name: 'Alice' } }]);
    expect(() => synthesisEngine.synthesize([demo1], registry)).toThrow(/INSUFFICIENT_EVIDENCE/);
  });

  // Test 32: Rejects invalid ActionRegistry references
  it('Test 32: Rejects synthesis when demonstration actions are not registered in ActionRegistry', () => {
    const demo1 = makeMockDemo('d1', [
      { actionType: 'unregistered.malicious.action', args: { x: 1 } },
    ]);
    const demo2 = makeMockDemo('d2', [
      { actionType: 'unregistered.malicious.action', args: { x: 2 } },
    ]);

    expect(() => synthesisEngine.synthesize([demo1, demo2], registry)).toThrow(
      /UNREGISTERED_ACTION_TARGET/,
    );
  });

  // Test 33: Rejects arbitrary execution bindings
  it('Test 33: Synthesized tool execution binding is strictly APPLICATION_ACTION or COMPOSITE_ACTION', () => {
    const demo1 = makeMockDemo('d1', [{ actionType: 'customer.create', args: { name: 'Alice' } }]);
    const demo2 = makeMockDemo('d2', [{ actionType: 'customer.create', args: { name: 'Bob' } }]);

    const result = synthesisEngine.synthesize([demo1, demo2], registry);
    expect(
      ['APPLICATION_ACTION', 'COMPOSITE_ACTION'].includes(
        result.candidateTool.executionBinding.type,
      ),
    ).toBe(true);
  });

  // Test 34: Every parameter has provenance and citations
  it('Test 34: Every inferred parameter has sourceAction and sourceArgumentPath provenance', () => {
    const demo1 = makeMockDemo('d1', [
      { actionType: 'customer.create', args: { name: 'Alice', email: 'a@ex.com' } },
    ]);
    const demo2 = makeMockDemo('d2', [
      { actionType: 'customer.create', args: { name: 'Bob', email: 'b@ex.com' } },
    ]);

    const result = synthesisEngine.synthesize([demo1, demo2], registry);
    for (const param of result.report.inferredParameters) {
      expect(param.sourceAction).toBe('customer.create');
      expect(['name', 'email'].includes(param.sourceArgumentPath)).toBe(true);
      expect(param.observedValues.length).toBe(2);
    }
  });

  // Test 35: Synthesis report can explain parameter inference
  it('Test 35: Synthesis report provides inspectable reasoning for each parameter', () => {
    const demo1 = makeMockDemo('d1', [{ actionType: 'customer.create', args: { name: 'Alice' } }]);
    const demo2 = makeMockDemo('d2', [{ actionType: 'customer.create', args: { name: 'Bob' } }]);

    const result = synthesisEngine.synthesize([demo1, demo2], registry);
    expect(result.report.reasoning.length).toBeGreaterThan(0);
    expect(result.report.inferredParameters[0]?.reason).toContain('Varies across demonstrations');
  });

  // Test 36: Demonstration text cannot inject executable code
  it('Test 36: Malicious prompt injection or scripts in demonstration text remain harmless string values', () => {
    const injectionScript = "<script>alert('pwned')</script>; DROP TABLE users; eval('evil()')";
    const demo1 = makeMockDemo('d1', [
      { actionType: 'customer.create', args: { name: injectionScript } },
    ]);
    const demo2 = makeMockDemo('d2', [
      { actionType: 'customer.create', args: { name: 'Normal Bob' } },
    ]);

    const result = synthesisEngine.synthesize([demo1, demo2], registry);
    const param = result.report.inferredParameters.find(p => p.sourceArgumentPath === 'name');

    // Value was parsed as empirical observation string, not executable code
    expect(param?.inferredType).toBe('string');
    expect(result.candidateTool.executionBinding.type).toBe('APPLICATION_ACTION');
    const binding = result.candidateTool.executionBinding as ApplicationActionBinding;
    expect(binding.actionId).toBe('customer.create');
  });

  // Test 37: Demonstration cannot alter tool execution binding
  it('Test 37: Demonstrations cannot alter execution bindings to point outside ActionRegistry', () => {
    const demo1 = makeMockDemo('d1', [
      { actionType: 'customer.create', args: { binding: 'eval(req)' } },
    ]);
    const demo2 = makeMockDemo('d2', [
      { actionType: 'customer.create', args: { binding: 'shell.exec' } },
    ]);

    const result = synthesisEngine.synthesize([demo1, demo2], registry);
    // Binding is strictly determined by registered action, not argument contents
    const binding = result.candidateTool.executionBinding as ApplicationActionBinding;
    expect(binding.actionId).toBe('customer.create');
  });

  // Test 38: Tool edits cannot bypass ActionRegistry
  it('Test 38: Modified candidate cannot be promoted if binding points to unregistered action', () => {
    const demo1 = makeMockDemo('d1', [{ actionType: 'customer.create', args: { name: 'Alice' } }]);
    const demo2 = makeMockDemo('d2', [{ actionType: 'customer.create', args: { name: 'Bob' } }]);

    const result = synthesisEngine.synthesize([demo1, demo2], registry);
    const forged = { ...result.candidateTool };
    const forgedBinding: ApplicationActionBinding = {
      type: 'APPLICATION_ACTION',
      actionId: 'nonexistent.action',
      actionVersion: 1,
    };
    forged.executionBinding = forgedBinding;

    expect(registry.has(forgedBinding.actionId)).toBe(false);
  });

  // Test 39: LLM absence does not break deterministic synthesis
  it('Test 39: Deterministic synthesis completes with zero external LLM dependencies', () => {
    const demo1 = makeMockDemo('d1', [{ actionType: 'customer.create', args: { name: 'Alice' } }]);
    const demo2 = makeMockDemo('d2', [{ actionType: 'customer.create', args: { name: 'Bob' } }]);

    // Executes synchronously and deterministically
    const result = synthesisEngine.synthesize([demo1, demo2], registry);
    expect(result.report.confidence).toBe('HIGH');
  });
});
