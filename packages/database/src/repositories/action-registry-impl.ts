import {
  ActionExecutionContext,
  IActionRegistry,
  RegisteredApplicationAction,
} from '@deputy/domain';

export class ActionRegistry implements IActionRegistry {
  private actions = new Map<string, RegisteredApplicationAction>();

  constructor() {
    this.registerDefaultActions();
  }

  public register<TInput extends Record<string, unknown>, TOutput>(
    action: RegisteredApplicationAction<TInput, TOutput>,
  ): void {
    const key = this.makeKey(action.id, action.version);
    this.actions.set(key, action as unknown as RegisteredApplicationAction);
  }

  public get(id: string, version?: number): RegisteredApplicationAction | undefined {
    if (version !== undefined) {
      return this.actions.get(this.makeKey(id, version));
    }
    // Return highest version matching ID
    const matches = Array.from(this.actions.values())
      .filter(a => a.id === id)
      .sort((a, b) => b.version - a.version);

    return matches[0];
  }

  public has(id: string, version?: number): boolean {
    return this.get(id, version) !== undefined;
  }

  public list(): RegisteredApplicationAction[] {
    return Array.from(this.actions.values());
  }

  private makeKey(id: string, version: number): string {
    return `${id}@v${version}`;
  }

  /**
   * Register trusted enterprise application actions for the Operations Console.
   * Crucial invariant: These are trusted native functions, NOT DOM macros or eval().
   */
  private registerDefaultActions(): void {
    // 1. Create Customer Action
    this.register({
      id: 'customer.create',
      version: 1,
      name: 'Create Customer',
      description: 'Creates a new customer profile record in the operations system.',
      inputSchema: {
        type: 'object',
        required: ['name', 'email'],
        properties: {
          name: { type: 'string', description: 'Customer full name' },
          email: { type: 'string', format: 'email', description: 'Customer email address' },
          currency: { type: 'string', description: 'Preferred currency' },
        },
      },
      handler: async (args: Record<string, unknown>, ctx: ActionExecutionContext) => {
        const customerId = `cust_${String(args['name'] || 'usr')
          .toLowerCase()
          .replace(/\s+/g, '_')}_${ctx.correlationId.slice(-4)}`;
        return {
          customerId,
          name: args['name'],
          email: args['email'],
          status: 'CREATED',
          createdAt: ctx.timestamp.toISOString(),
          correlationId: ctx.correlationId,
        };
      },
      reversibility: 'COMPENSATABLE',
      riskLevel: 'MEDIUM',
      sideEffects: ['Writes customer record', 'Sends welcome email'],
      requiredPermissions: ['customer.write'],
    });

    // 2. Create Invoice Action
    this.register({
      id: 'invoice.create',
      version: 1,
      name: 'Create Customer Invoice',
      description: 'Generates a billable invoice for an existing customer account.',
      inputSchema: {
        type: 'object',
        required: ['customerId', 'amount'],
        properties: {
          customerId: { type: 'string', description: 'Customer ID' },
          amount: { type: 'number', minimum: 0, description: 'Invoice amount' },
          currency: { type: 'string', description: 'Billing currency', default: 'INR' },
        },
      },
      handler: async (args: Record<string, unknown>, ctx: ActionExecutionContext) => {
        return {
          invoiceId: `inv_${Date.now()}`,
          customerId: args['customerId'],
          amount: args['amount'],
          currency: args['currency'] || 'INR',
          status: 'ISSUED',
          issuedAt: ctx.timestamp.toISOString(),
          correlationId: ctx.correlationId,
        };
      },
      reversibility: 'COMPENSATABLE',
      riskLevel: 'HIGH',
      sideEffects: ['Generates accounts receivable invoice', 'Notifies customer'],
      requiredPermissions: ['finance.invoice.write'],
    });

    // 3. Create Refund Action
    this.register({
      id: 'refund.create',
      version: 1,
      name: 'Create Customer Refund',
      description: 'Issues a monetary refund to a customer transaction.',
      inputSchema: {
        type: 'object',
        required: ['customerId', 'amount', 'reason'],
        properties: {
          customerId: { type: 'string' },
          amount: { type: 'number', minimum: 1 },
          reason: { type: 'string' },
        },
      },
      handler: async (args: Record<string, unknown>, ctx: ActionExecutionContext) => {
        return {
          refundId: `ref_${Date.now()}`,
          customerId: args['customerId'],
          amount: args['amount'],
          status: 'PROCESSED',
          processedAt: ctx.timestamp.toISOString(),
          correlationId: ctx.correlationId,
        };
      },
      reversibility: 'COMPENSATABLE',
      riskLevel: 'HIGH',
      sideEffects: ['Deducts balance', 'Sends customer notification email', 'Emits ledger event'],
      requiredPermissions: ['finance.refund.write'],
    });

    // 4. Update Customer Action
    this.register({
      id: 'customer.update',
      version: 1,
      name: 'Update Customer Profile',
      description: 'Updates customer contact details and preferences.',
      inputSchema: {
        type: 'object',
        required: ['customerId'],
        properties: {
          customerId: { type: 'string' },
          email: { type: 'string' },
          name: { type: 'string' },
        },
      },
      handler: async (args: Record<string, unknown>, ctx: ActionExecutionContext) => {
        return {
          customerId: args['customerId'],
          status: 'UPDATED',
          updatedFields: Object.keys(args).filter(k => k !== 'customerId'),
          updatedAt: ctx.timestamp.toISOString(),
        };
      },
      reversibility: 'REVERSIBLE',
      riskLevel: 'MEDIUM',
      sideEffects: ['Updates CRM database record'],
      requiredPermissions: ['customer.profile.write'],
    });

    // 5. Schedule Meeting Action
    this.register({
      id: 'meeting.schedule',
      version: 1,
      name: 'Schedule Customer Meeting',
      description: 'Books a calendar appointment with a client or account representative.',
      inputSchema: {
        type: 'object',
        required: ['customerId', 'date', 'durationMinutes'],
        properties: {
          customerId: { type: 'string' },
          date: { type: 'string' },
          durationMinutes: { type: 'number' },
        },
      },
      handler: async (args: Record<string, unknown>, ctx: ActionExecutionContext) => {
        return {
          meetingId: `meet_${Date.now()}`,
          customerId: args['customerId'],
          scheduledDate: args['date'],
          duration: args['durationMinutes'],
          status: 'CONFIRMED',
          createdAt: ctx.timestamp.toISOString(),
        };
      },
      reversibility: 'REVERSIBLE',
      riskLevel: 'LOW',
      sideEffects: ['Calendar invite dispatched'],
      requiredPermissions: ['calendar.events.write'],
    });

    // 6. Schedule Followup Action
    this.register({
      id: 'followup.schedule',
      version: 1,
      name: 'Schedule Follow-up Task',
      description: 'Creates a pending follow-up reminder for customer support.',
      inputSchema: {
        type: 'object',
        required: ['customerId', 'date', 'notes'],
        properties: {
          customerId: { type: 'string' },
          date: { type: 'string' },
          notes: { type: 'string' },
        },
      },
      handler: async (args: Record<string, unknown>, ctx: ActionExecutionContext) => {
        return {
          followupId: `fup_${Date.now()}`,
          customerId: args['customerId'],
          date: args['date'],
          notes: args['notes'],
          status: 'SCHEDULED',
          scheduledAt: ctx.timestamp.toISOString(),
        };
      },
      reversibility: 'REVERSIBLE',
      riskLevel: 'LOW',
      sideEffects: ['Queues reminder task'],
      requiredPermissions: ['tasks.write'],
    });

    // 7. Archive Customer Action
    this.register({
      id: 'customer.archive',
      version: 1,
      name: 'Archive Customer Account',
      description: 'Permanently archives an account and freezes assets.',
      inputSchema: {
        type: 'object',
        required: ['customerId', 'reason'],
        properties: {
          customerId: { type: 'string' },
          reason: { type: 'string' },
        },
      },
      handler: async (args: Record<string, unknown>, ctx: ActionExecutionContext) => {
        return {
          customerId: args['customerId'],
          status: 'ARCHIVED',
          archivedAt: ctx.timestamp.toISOString(),
        };
      },
      reversibility: 'IRREVERSIBLE',
      riskLevel: 'CRITICAL',
      sideEffects: ['Account frozen', 'API tokens revoked', 'Irreversible compliance flag set'],
      requiredPermissions: ['admin.account.archive'],
    });
  }
}
