import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getEnv } from '@deputy/config';
import { LearnedTool } from '@deputy/domain';
import { structuredErrorHandler } from './middleware/error-handler.js';
import { idempotencyMiddleware } from './middleware/idempotency.js';
import { createRateLimiter } from './middleware/rate-limiter.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { securityHeadersMiddleware } from './middleware/security-headers.js';
import { createAuditRoutes } from './routes/audit.js';
import { createAuthorizationRoutes } from './routes/authorizations.js';
import { createDemonstrationRoutes } from './routes/demonstrations.js';
import { createHealthRoutes } from './routes/health.js';
import { createProposalRoutes } from './routes/proposals.js';
import { createSynthesisRoutes } from './routes/synthesis.js';
import { createToolRoutes } from './routes/tools.js';
import { createWebAuthnRoutes } from './routes/webauthn.js';
import { AppServices, initializeServices } from './services/index.js';
import { mountStaticSpa } from './static.js';

export function createApp(customServices?: AppServices) {
  const env = getEnv();
  const services = customServices || initializeServices();
  const app = new Hono();

  // 1. Security & Global Middleware
  app.use('*', requestIdMiddleware);
  app.use('*', securityHeadersMiddleware);
  app.use('*', idempotencyMiddleware());

  // Strict CORS: match against ALLOWED_ORIGINS array, never wildcard '*' with credentials
  app.use(
    '*',
    cors({
      origin: (origin: string) => {
        if (!origin) return null;
        return env.ALLOWED_ORIGINS.includes(origin) ? origin : null;
      },
      allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: [
        'Content-Type',
        'Authorization',
        'x-request-id',
        'x-deputy-authorization-id',
        'idempotency-key',
        'x-idempotency-key',
      ],
      exposeHeaders: [
        'x-request-id',
        'x-idempotency-replayed',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
      ],
      maxAge: 86400,
      credentials: true,
    }),
  );

  app.use('/api/*', createRateLimiter(env.RATE_LIMIT_MAX, env.RATE_LIMIT_WINDOW_MS));

  // 2. Health and Readiness Diagnostics
  app.route('/api', createHealthRoutes(services));

  // 3. API Subrouters
  app.route('/api/tools', createToolRoutes(services));
  app.route('/api/demonstrations', createDemonstrationRoutes(services));
  app.route('/api/synthesis', createSynthesisRoutes(services));
  app.route('/api/tool-proposals', createProposalRoutes(services));
  app.route('/api/authorizations', createAuthorizationRoutes(services));
  app.route('/api/auth/webauthn', createWebAuthnRoutes(services));
  app.route('/api/audit', createAuditRoutes(services));

  // 4. Optional single-origin SPA serving (WebAuthn RP/origin agreement).
  if (env.SERVE_STATIC) {
    mountStaticSpa(app, env);
  }

  // 5. Structured Error Handler
  app.onError(structuredErrorHandler);

  return { app, services };
}

/**
 * (Re)register the two seeded tools into the in-memory WebMCP adapter. The
 * adapter is process-local, so this runs on every boot — including restarts
 * against a durable database where the rows already exist.
 */
function registerSeedTools(services: AppServices, tools: (LearnedTool | undefined)[]): void {
  for (const tool of tools) {
    if (!tool || services.webmcpAdapter.hasTool(tool.toolId)) continue;
    if (tool.toolId === 'tool_refund_customer') {
      services.webmcpAdapter.registerTool(tool, async (params: Record<string, unknown>) => ({
        status: 'DELEGATED_TO_SECURE_GATEWAY',
        params,
      }));
    } else {
      services.webmcpAdapter.registerTool(tool, async (params: Record<string, unknown>) => ({
        status: 'UPDATED',
        params,
      }));
    }
  }
}

/**
 * Seed initial sample tools and demonstrations into repository
 * for local development, demo scenarios, and testing.
 *
 * Idempotent: with a durable (POSTGRES) repository the rows persist across
 * restarts, so the DB writes only run against an empty store. The WebMCP
 * adapter is always (re)registered so tools are present on every boot.
 */
export async function seedSampleData(services: AppServices): Promise<void> {
  const now = new Date();

  const seededRefund = await services.toolRepo.getById('tool_refund_customer');
  const seededUpdate = await services.toolRepo.getById('tool_update_customer');
  if (seededRefund || seededUpdate) {
    registerSeedTools(services, [seededRefund, seededUpdate]);
    return;
  }

  // Seed Refund Tool
  await services.toolRepo.create({
    toolId: 'tool_refund_customer',
    name: 'refund_customer',
    description: 'Issues a monetary refund to a specified customer transaction.',
    version: 1,
    inputSchema: {
      type: 'object',
      required: ['customerId', 'amount', 'reason'],
      properties: {
        customerId: { type: 'string', description: 'Unique customer identifier' },
        amount: { type: 'number', minimum: 1, description: 'Refund amount in cents' },
        reason: { type: 'string', description: 'Justification for refund' },
      },
    },
    executionBinding: {
      type: 'APPLICATION_ACTION',
      actionId: 'refund.create',
      actionVersion: 1,
    },
    sourceDemonstrations: ['demo_init_01'],
    demonstrationCount: 1,
    parameterProvenance: {
      customerId: {
        source: 'ui.form.refund',
        origin: 'https://admin.deputy.internal',
        trustClass: 'FIRST_PARTY',
        retrievedAt: now,
        contentId: 'cid_cust_1',
      },
    },
    reversibility: 'COMPENSATABLE',
    riskLevel: 'HIGH',
    approvalPolicy: {
      requiresHumanAuthorization: true,
      requiredRoles: ['finance_manager', 'admin'],
      maxAutonomousRiskLevel: 'MEDIUM',
    },
    status: 'ACTIVE',
    creator: { id: 'admin_usr_01', role: 'lead_architect' },
    createdAt: now,
    updatedAt: now,
    provenance: {
      source: 'system.seed',
      origin: 'https://deputy.internal',
      trustClass: 'SYSTEM_GENERATED',
      retrievedAt: now,
      contentId: 'cid_seed_refund',
    },
    originRestrictions: [],
  });

  // Seed Customer Update Tool
  await services.toolRepo.create({
    toolId: 'tool_update_customer',
    name: 'update_customer_profile',
    description: 'Updates customer profile information in the CRM.',
    version: 1,
    inputSchema: {
      type: 'object',
      required: ['customerId', 'email'],
      properties: {
        customerId: { type: 'string' },
        email: { type: 'string', format: 'email' },
      },
    },
    executionBinding: {
      type: 'APPLICATION_ACTION',
      actionId: 'customer.update',
      actionVersion: 1,
    },
    sourceDemonstrations: ['demo_init_02'],
    demonstrationCount: 1,
    parameterProvenance: {},
    reversibility: 'REVERSIBLE',
    riskLevel: 'MEDIUM',
    approvalPolicy: {
      requiresHumanAuthorization: false,
      requiredRoles: [],
      maxAutonomousRiskLevel: 'MEDIUM',
    },
    status: 'ACTIVE',
    creator: { id: 'admin_usr_01', role: 'lead_architect' },
    createdAt: now,
    updatedAt: now,
    provenance: {
      source: 'system.seed',
      origin: 'https://deputy.internal',
      trustClass: 'SYSTEM_GENERATED',
      retrievedAt: now,
      contentId: 'cid_seed_update',
    },
    originRestrictions: [],
  });

  // Register the freshly-seeded tools into the WebMCP adapter.
  registerSeedTools(services, [
    await services.toolRepo.getById('tool_refund_customer'),
    await services.toolRepo.getById('tool_update_customer'),
  ]);

  // Seed Demonstration 1: Alice onboarding & invoice creation
  await services.demonstrationRepo.create({
    demonstrationId: 'demo_ops_alice',
    sessionId: 'sess_ops_01',
    actorId: 'admin_usr_01',
    taskDescription: 'Create Customer and Bill Initial Invoice',
    startedAt: new Date(now.getTime() - 120000),
    completedAt: new Date(now.getTime() - 90000),
    status: 'COMPLETED',
    applicationContext: { environment: 'operations_console', appVersion: '2.0.0' },
    actions: [
      {
        actionId: 'act_demo_alice_01',
        actionType: 'customer.create',
        actionVersion: 1,
        arguments: {
          name: 'Alice Smith',
          email: 'alice@example.com',
          currency: 'INR',
          requestId: 'req_alice_001',
          timestamp: new Date(now.getTime() - 110000).toISOString(),
        },
        actor: { id: 'admin_usr_01', role: 'operations_lead', type: 'HUMAN' },
        timestamp: new Date(now.getTime() - 110000),
        sessionId: 'sess_ops_01',
        demonstrationId: 'demo_ops_alice',
        sideEffects: ['Writes customer record', 'Sends welcome email'],
        reversibility: 'COMPENSATABLE',
        provenance: {
          source: 'operations.console',
          origin: 'http://localhost:5173',
          trustClass: 'FIRST_PARTY',
          retrievedAt: now,
          contentId: 'cid_act_alice_01',
        },
        correlationId: 'corr_alice_01',
      },
      {
        actionId: 'act_demo_alice_02',
        actionType: 'invoice.create',
        actionVersion: 1,
        arguments: {
          customerId: 'cust_alice_smith',
          amount: 2500,
          currency: 'INR',
          requestId: 'req_alice_002',
          timestamp: new Date(now.getTime() - 95000).toISOString(),
        },
        actor: { id: 'admin_usr_01', role: 'operations_lead', type: 'HUMAN' },
        timestamp: new Date(now.getTime() - 95000),
        sessionId: 'sess_ops_01',
        demonstrationId: 'demo_ops_alice',
        sideEffects: ['Generates accounts receivable invoice'],
        reversibility: 'COMPENSATABLE',
        provenance: {
          source: 'operations.console',
          origin: 'http://localhost:5173',
          trustClass: 'FIRST_PARTY',
          retrievedAt: now,
          contentId: 'cid_act_alice_02',
        },
        correlationId: 'corr_alice_02',
      },
    ],
    metadata: { note: 'Demonstration 1: Alice customer setup with 2,500 INR invoice' },
  });

  // Seed Demonstration 2: Bob onboarding & invoice creation
  await services.demonstrationRepo.create({
    demonstrationId: 'demo_ops_bob',
    sessionId: 'sess_ops_02',
    actorId: 'admin_usr_01',
    taskDescription: 'Create Customer and Bill Initial Invoice',
    startedAt: new Date(now.getTime() - 80000),
    completedAt: new Date(now.getTime() - 50000),
    status: 'COMPLETED',
    applicationContext: { environment: 'operations_console', appVersion: '2.0.0' },
    actions: [
      {
        actionId: 'act_demo_bob_01',
        actionType: 'customer.create',
        actionVersion: 1,
        arguments: {
          name: 'Bob Jones',
          email: 'bob@example.com',
          currency: 'INR',
          requestId: 'req_bob_001',
          timestamp: new Date(now.getTime() - 70000).toISOString(),
        },
        actor: { id: 'admin_usr_01', role: 'operations_lead', type: 'HUMAN' },
        timestamp: new Date(now.getTime() - 70000),
        sessionId: 'sess_ops_02',
        demonstrationId: 'demo_ops_bob',
        sideEffects: ['Writes customer record', 'Sends welcome email'],
        reversibility: 'COMPENSATABLE',
        provenance: {
          source: 'operations.console',
          origin: 'http://localhost:5173',
          trustClass: 'FIRST_PARTY',
          retrievedAt: now,
          contentId: 'cid_act_bob_01',
        },
        correlationId: 'corr_bob_01',
      },
      {
        actionId: 'act_demo_bob_02',
        actionType: 'invoice.create',
        actionVersion: 1,
        arguments: {
          customerId: 'cust_bob_jones',
          amount: 4200,
          currency: 'INR',
          requestId: 'req_bob_002',
          timestamp: new Date(now.getTime() - 55000).toISOString(),
        },
        actor: { id: 'admin_usr_01', role: 'operations_lead', type: 'HUMAN' },
        timestamp: new Date(now.getTime() - 55000),
        sessionId: 'sess_ops_02',
        demonstrationId: 'demo_ops_bob',
        sideEffects: ['Generates accounts receivable invoice'],
        reversibility: 'COMPENSATABLE',
        provenance: {
          source: 'operations.console',
          origin: 'http://localhost:5173',
          trustClass: 'FIRST_PARTY',
          retrievedAt: now,
          contentId: 'cid_act_bob_02',
        },
        correlationId: 'corr_bob_02',
      },
    ],
    metadata: { note: 'Demonstration 2: Bob customer setup with 4,200 INR invoice' },
  });

  // Seed initial audit log
  await services.auditRepo.append({
    eventId: `evt_${Date.now()}_seed`,
    timestamp: now,
    eventType: 'TOOL_REGISTERED',
    actor: { id: 'system', type: 'SYSTEM' },
    toolId: 'tool_refund_customer',
    toolVersion: 1,
    status: 'SUCCESS',
    reason: 'System bootstrap completed with Operations Console demonstrations seeded.',
  });
}
