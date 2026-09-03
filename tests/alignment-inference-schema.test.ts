import { describe, expect, it } from 'vitest';
import { ActionRegistry } from '@deputy/database';
import { Demonstration, SemanticAction } from '@deputy/domain';
import { AlignmentEngine, ParameterInferenceEngine, SchemaGenerator } from '@deputy/synthesis';

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

describe('Trace Alignment Engine (Tests 10-15)', () => {
  const engine = new AlignmentEngine();

  it('Test 10: Aligns two identical task traces', () => {
    const demo1 = makeMockDemo('d1', [{ actionType: 'customer.create', args: { name: 'Alice' } }]);
    const demo2 = makeMockDemo('d2', [{ actionType: 'customer.create', args: { name: 'Alice' } }]);

    const aligned = engine.align([demo1, demo2]);
    expect(aligned.alignedSteps.length).toBe(1);
    expect(aligned.alignmentScore).toBe(1);
    expect(aligned.alignedSteps[0]!.stableArguments['name']).toBe('Alice');
    expect(aligned.alignedSteps[0]!.variableArguments['name']).toBeUndefined();
  });

  it('Test 11: Detects changed scalar values', () => {
    const demo1 = makeMockDemo('d1', [{ actionType: 'customer.create', args: { name: 'Alice' } }]);
    const demo2 = makeMockDemo('d2', [{ actionType: 'customer.create', args: { name: 'Bob' } }]);

    const aligned = engine.align([demo1, demo2]);
    expect(aligned.alignedSteps[0]!.variableArguments['name']).toEqual(['Alice', 'Bob']);
  });

  it('Test 12: Detects stable values across variable traces', () => {
    const demo1 = makeMockDemo('d1', [
      { actionType: 'customer.create', args: { name: 'Alice', currency: 'INR' } },
    ]);
    const demo2 = makeMockDemo('d2', [
      { actionType: 'customer.create', args: { name: 'Bob', currency: 'INR' } },
    ]);

    const aligned = engine.align([demo1, demo2]);
    expect(aligned.alignedSteps[0]!.stableArguments['currency']).toBe('INR');
    expect(aligned.alignedSteps[0]!.variableArguments['currency']).toBeUndefined();
  });

  it('Test 13: Detects changed numeric values', () => {
    const demo1 = makeMockDemo('d1', [{ actionType: 'invoice.create', args: { amount: 2500 } }]);
    const demo2 = makeMockDemo('d2', [{ actionType: 'invoice.create', args: { amount: 4200 } }]);

    const aligned = engine.align([demo1, demo2]);
    expect(aligned.alignedSteps[0]!.variableArguments['amount']).toEqual([2500, 4200]);
  });

  it('Test 14: Detects optional action differences with penalty', () => {
    const demo1 = makeMockDemo('d1', [
      { actionType: 'customer.create', args: { name: 'Alice' } },
      { actionType: 'followup.schedule', args: { date: '2026-10-01' } },
    ]);
    const demo2 = makeMockDemo('d2', [{ actionType: 'customer.create', args: { name: 'Bob' } }]);

    const aligned = engine.align([demo1, demo2]);
    expect(aligned.alignedSteps.length).toBe(2);
    expect(aligned.alignmentScore).toBeLessThan(1);
    expect(aligned.divergences.some(d => d.includes('Optional action detected'))).toBe(true);
  });

  it('Test 15: Rejects incompatible action sequences', () => {
    const demo1 = makeMockDemo('d1', [{ actionType: 'customer.create', args: { name: 'Alice' } }]);
    const demo2 = makeMockDemo('d2', [
      { actionType: 'customer.archive', args: { customerId: 'c1' } },
    ]);

    expect(() => engine.align([demo1, demo2])).toThrow(/Incompatible action sequences/);
  });
});

describe('Parameter Inference & JSON Schema Generation (Tests 16-24)', () => {
  const alignmentEngine = new AlignmentEngine();
  const paramEngine = new ParameterInferenceEngine();
  const schemaGen = new SchemaGenerator();
  const registry = new ActionRegistry();

  it('Test 16: Infers string parameter correctly', () => {
    const demo1 = makeMockDemo('d1', [
      { actionType: 'customer.create', args: { name: 'Alice', email: 'alice@ex.com' } },
    ]);
    const demo2 = makeMockDemo('d2', [
      { actionType: 'customer.create', args: { name: 'Bob', email: 'bob@ex.com' } },
    ]);

    const aligned = alignmentEngine.align([demo1, demo2]);
    const params = paramEngine.infer(aligned, registry);

    const nameParam = params.find(p => p.sourceArgumentPath === 'name');
    expect(nameParam).toBeDefined();
    expect(nameParam?.inferredType).toBe('string');
  });

  it('Test 17: Infers numeric parameter correctly', () => {
    const demo1 = makeMockDemo('d1', [
      { actionType: 'invoice.create', args: { customerId: 'c1', amount: 2500 } },
    ]);
    const demo2 = makeMockDemo('d2', [
      { actionType: 'invoice.create', args: { customerId: 'c2', amount: 4200 } },
    ]);

    const aligned = alignmentEngine.align([demo1, demo2]);
    const params = paramEngine.infer(aligned, registry);

    const amountParam = params.find(p => p.sourceArgumentPath === 'amount');
    expect(amountParam).toBeDefined();
    expect(amountParam?.inferredType).toBe('number');
  });

  it('Test 18: Preserves authoritative source action schema constraints', () => {
    const demo1 = makeMockDemo('d1', [
      { actionType: 'customer.create', args: { name: 'Alice', email: 'alice@example.com' } },
    ]);
    const demo2 = makeMockDemo('d2', [
      { actionType: 'customer.create', args: { name: 'Bob', email: 'bob@example.com' } },
    ]);

    const aligned = alignmentEngine.align([demo1, demo2]);
    const params = paramEngine.infer(aligned, registry);
    const schema = schemaGen.generate(params);

    const schemaProps = schema.properties as Record<
      string,
      { type: string; format?: string; minimum?: number }
    >;
    const emailProp = schemaProps['customerEmail']!;
    expect(emailProp.format).toBe('email');
  });

  it('Test 19: Ignores known volatile metadata (timestamp, requestId, nonce)', () => {
    const demo1 = makeMockDemo('d1', [
      {
        actionType: 'customer.create',
        args: {
          name: 'Alice',
          email: 'alice@example.com',
          requestId: 'req_001',
          timestamp: '2026-09-01T10:00:00Z',
          nonce: 'nonce_abc',
        },
      },
    ]);
    const demo2 = makeMockDemo('d2', [
      {
        actionType: 'customer.create',
        args: {
          name: 'Bob',
          email: 'bob@example.com',
          requestId: 'req_002',
          timestamp: '2026-09-01T10:05:00Z',
          nonce: 'nonce_xyz',
        },
      },
    ]);

    const aligned = alignmentEngine.align([demo1, demo2]);
    const params = paramEngine.infer(aligned, registry);

    expect(params.some(p => p.sourceArgumentPath === 'requestId')).toBe(false);
    expect(params.some(p => p.sourceArgumentPath === 'timestamp')).toBe(false);
    expect(params.some(p => p.sourceArgumentPath === 'nonce')).toBe(false);
  });

  it('Test 20: Generates deterministic parameter names', () => {
    const demo1 = makeMockDemo('d1', [
      { actionType: 'customer.create', args: { name: 'Alice', email: 'alice@example.com' } },
      { actionType: 'invoice.create', args: { customerId: 'c1', amount: 2500 } },
    ]);
    const demo2 = makeMockDemo('d2', [
      { actionType: 'customer.create', args: { name: 'Bob', email: 'bob@example.com' } },
      { actionType: 'invoice.create', args: { customerId: 'c2', amount: 4200 } },
    ]);

    const aligned = alignmentEngine.align([demo1, demo2]);
    const params = paramEngine.infer(aligned, registry);

    expect(params.some(p => p.parameterName === 'customerName')).toBe(true);
    expect(params.some(p => p.parameterName === 'customerEmail')).toBe(true);
    expect(params.some(p => p.parameterName === 'invoiceAmount')).toBe(true);
  });

  it('Test 21: Generated JSON Schema validates valid input payload', () => {
    const demo1 = makeMockDemo('d1', [
      { actionType: 'customer.create', args: { name: 'Alice', email: 'a@ex.com' } },
    ]);
    const demo2 = makeMockDemo('d2', [
      { actionType: 'customer.create', args: { name: 'Bob', email: 'b@ex.com' } },
    ]);

    const aligned = alignmentEngine.align([demo1, demo2]);
    const params = paramEngine.infer(aligned, registry);
    const schema = schemaGen.generate(params);

    const schemaProps = schema.properties as Record<string, { type: string }>;
    expect(schema.type).toBe('object');
    expect(schema.properties).toBeDefined();
    expect(schemaProps['customerName']?.type).toBe('string');
  });

  it('Test 22: Generated schema rejects invalid input types', () => {
    const demo1 = makeMockDemo('d1', [{ actionType: 'invoice.create', args: { amount: 2500 } }]);
    const demo2 = makeMockDemo('d2', [{ actionType: 'invoice.create', args: { amount: 4200 } }]);

    const aligned = alignmentEngine.align([demo1, demo2]);
    const params = paramEngine.infer(aligned, registry);
    const schema = schemaGen.generate(params);

    const schemaProps = schema.properties as Record<string, { type: string; minimum?: number }>;
    const amountProp = schemaProps['invoiceAmount']!;
    expect(amountProp.type).toBe('number');
    expect(amountProp.minimum).toBe(0);
  });

  it('Test 23: Enforces additionalProperties: false', () => {
    const demo1 = makeMockDemo('d1', [{ actionType: 'customer.create', args: { name: 'Alice' } }]);
    const demo2 = makeMockDemo('d2', [{ actionType: 'customer.create', args: { name: 'Bob' } }]);

    const aligned = alignmentEngine.align([demo1, demo2]);
    const params = paramEngine.infer(aligned, registry);
    const schema = schemaGen.generate(params);

    expect(schema.additionalProperties).toBe(false);
  });

  it('Test 24: Enforces required fields for non-optional parameters', () => {
    const demo1 = makeMockDemo('d1', [
      { actionType: 'customer.create', args: { name: 'Alice', email: 'a@ex.com' } },
    ]);
    const demo2 = makeMockDemo('d2', [
      { actionType: 'customer.create', args: { name: 'Bob', email: 'b@ex.com' } },
    ]);

    const aligned = alignmentEngine.align([demo1, demo2]);
    const params = paramEngine.infer(aligned, registry);
    const schema = schemaGen.generate(params);

    expect(Array.isArray(schema.required)).toBe(true);
    expect((schema.required as string[]).includes('customerName')).toBe(true);
    expect((schema.required as string[]).includes('customerEmail')).toBe(true);
  });
});
