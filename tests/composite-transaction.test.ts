import { describe, expect, it } from 'vitest';
import { ActionRegistry } from '@deputy/database';
import { LearnedTool, ToolProposal } from '@deputy/domain';
import { ToolExecutor } from '@deputy/security';

describe('Composite Action Transaction Safety & Dataflow Engine', () => {
  function setupTestEnvironment() {
    const registry = new ActionRegistry();

    // 1. Step 1 Action: Customer Creation
    registry.register({
      id: 'customer.create',
      version: 1,
      name: 'Create Customer',
      description: 'Creates CRM customer record',
      riskLevel: 'LOW',
      reversibility: 'COMPENSATABLE',
      inputSchema: { type: 'object', required: ['name', 'email'] },
      sideEffects: ['Writes customer record'],
      requiredPermissions: [],
      handler: async args => {
        return {
          id: `cust_${String(args['name']).toLowerCase().replace(/\s+/g, '_')}`,
          name: args['name'],
          email: args['email'],
        };
      },
    });

    // 2. Compensation Action for Step 1
    let compensationExecuted = false;
    let compensatedCustomerId: string | undefined = undefined;
    registry.register({
      id: 'customer.archive',
      version: 1,
      name: 'Archive Customer',
      description: 'Rolls back customer creation',
      riskLevel: 'LOW',
      reversibility: 'REVERSIBLE',
      inputSchema: { type: 'object', required: ['customerId'] },
      sideEffects: ['Archives customer record'],
      requiredPermissions: [],
      handler: async args => {
        compensationExecuted = true;
        compensatedCustomerId = args['customerId'] as string;
        return { archived: true, customerId: args['customerId'] };
      },
    });

    // 3. Step 2 Action: Invoice Creation (can succeed or fail based on flag)
    let shouldInvoiceFail = false;
    registry.register({
      id: 'invoice.create',
      version: 1,
      name: 'Create Invoice',
      description: 'Issues invoice for customer',
      riskLevel: 'MEDIUM',
      reversibility: 'COMPENSATABLE',
      inputSchema: { type: 'object', required: ['customerId', 'amount'] },
      sideEffects: ['Generates invoice'],
      requiredPermissions: [],
      handler: async args => {
        if (shouldInvoiceFail) {
          throw new Error('Billing network timeout: external gateway unavailable.');
        }
        return {
          invoiceId: `inv_${Date.now()}`,
          customerId: args['customerId'],
          amount: args['amount'],
          status: 'ISSUED',
        };
      },
    });

    const executor = new ToolExecutor(registry);

    const compositeTool: LearnedTool = {
      toolId: 'tool_onboard_and_bill',
      name: 'onboard_and_bill_customer',
      description: 'Creates a customer and issues first invoice with automated rollback.',
      version: 1,
      inputSchema: {
        type: 'object',
        required: ['name', 'email', 'amount'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          amount: { type: 'number' },
        },
      },
      executionBinding: {
        type: 'COMPOSITE_ACTION',
        executionMode: 'COMPENSATABLE',
        actions: [
          {
            actionId: 'customer.create',
            actionVersion: 1,
            stepOrder: 0,
            parameterMapping: { name: 'name', email: 'email' },
            compensation: {
              compensationActionId: 'customer.archive',
              compensationActionVersion: 1,
              parameterMapping: { customerId: 'id' },
            },
          },
          {
            actionId: 'invoice.create',
            actionVersion: 1,
            stepOrder: 1,
            parameterMapping: { amount: 'amount' },
            dataflowMappings: [
              {
                sourceStepOrder: 0,
                sourcePath: 'id',
                targetParam: 'customerId',
              },
            ],
          },
        ],
      },
      sourceDemonstrations: ['demo_1'],
      demonstrationCount: 1,
      parameterProvenance: {},
      reversibility: 'COMPENSATABLE',
      riskLevel: 'LOW',
      approvalPolicy: {
        requiresHumanAuthorization: false,
        requiredRoles: [],
        maxAutonomousRiskLevel: 'MEDIUM',
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
      originRestrictions: [],
    };

    return {
      registry,
      executor,
      compositeTool,
      setInvoiceFail: (val: boolean) => {
        shouldInvoiceFail = val;
      },
      didCompensationRun: () => compensationExecuted,
      getCompensatedCustomerId: () => compensatedCustomerId,
    };
  }

  it('successfully resolves declarative dataflow and completes workflow with SUCCESS outcome', async () => {
    const env = setupTestEnvironment();

    const proposal: ToolProposal = {
      proposalId: 'prop_001',
      requestId: 'req_001',
      toolId: env.compositeTool.toolId,
      toolVersion: 1,
      arguments: {
        name: 'Alice Smith',
        email: 'alice@example.com',
        amount: 2500,
      },
      proposedBy: {
        agentId: 'agent_onboarding',
        origin: 'http://localhost:5173',
      },
      timestamp: new Date(),
    };

    const result = await env.executor.execute(proposal, env.compositeTool);

    expect(result.success).toBe(true);
    expect(result.outcome).toBe('SUCCESS');
    expect(result.stepRecords).toHaveLength(2);
    expect(result.stepRecords![0]!.status).toBe('SUCCESS');
    expect(result.stepRecords![0]!.output).toEqual({
      id: 'cust_alice_smith',
      name: 'Alice Smith',
      email: 'alice@example.com',
    });
    expect(result.stepRecords![1]!.status).toBe('SUCCESS');
    expect((result.stepRecords![1]!.output as any).customerId).toBe('cust_alice_smith');
    expect(env.didCompensationRun()).toBe(false);
  });

  it('triggers automated reverse compensation on downstream step failure and reports COMPENSATED', async () => {
    const env = setupTestEnvironment();
    env.setInvoiceFail(true); // Force Step 2 failure

    const proposal: ToolProposal = {
      proposalId: 'prop_002',
      requestId: 'req_002',
      toolId: env.compositeTool.toolId,
      toolVersion: 1,
      arguments: {
        name: 'Bob Jones',
        email: 'bob@example.com',
        amount: 4200,
      },
      proposedBy: {
        agentId: 'agent_onboarding',
        origin: 'http://localhost:5173',
      },
      timestamp: new Date(),
    };

    const result = await env.executor.execute(proposal, env.compositeTool);

    expect(result.success).toBe(false);
    expect(result.outcome).toBe('COMPENSATED');
    expect(env.didCompensationRun()).toBe(true);
    expect(env.getCompensatedCustomerId()).toBe('cust_bob_jones');

    expect(result.stepRecords).toHaveLength(2);
    expect(result.stepRecords![0]!.compensationStatus).toBe('COMPENSATED');
    expect(result.stepRecords![1]!.status).toBe('FAILURE');
  });

  it('rejects circular or forward-referencing dataflow mappings statically before execution', async () => {
    const env = setupTestEnvironment();

    // Maliciously forge forward reference (Step 0 depends on Step 1)
    const invalidTool: LearnedTool = {
      ...env.compositeTool,
      executionBinding: {
        type: 'COMPOSITE_ACTION',
        actions: [
          {
            actionId: 'customer.create',
            actionVersion: 1,
            stepOrder: 0,
            parameterMapping: {},
            dataflowMappings: [
              {
                sourceStepOrder: 1, // Forward reference!
                sourcePath: 'invoiceId',
                targetParam: 'invRef',
              },
            ],
          },
          {
            actionId: 'invoice.create',
            actionVersion: 1,
            stepOrder: 1,
            parameterMapping: {},
          },
        ],
      },
    };

    const proposal: ToolProposal = {
      proposalId: 'prop_003',
      requestId: 'req_003',
      toolId: invalidTool.toolId,
      toolVersion: 1,
      arguments: { name: 'Eve', email: 'eve@example.com', amount: 100 },
      proposedBy: { agentId: 'agent_onboarding', origin: 'http://localhost:5173' },
      timestamp: new Date(),
    };

    const result = await env.executor.execute(proposal, invalidTool);

    expect(result.success).toBe(false);
    expect(result.outcome).toBe('NO_EFFECT');
    expect(result.error?.code).toBe('INVALID_DATAFLOW_MAPPING');
  });
});
