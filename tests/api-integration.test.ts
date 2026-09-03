import { describe, it, expect, beforeEach } from 'vitest';
import { createApp, seedSampleData } from '../apps/server/src/app.js';
import { computeArgumentDigest } from '@deputy/security';

describe('DEPUTY Full-Stack API Integration Tests', () => {
  let app: ReturnType<typeof createApp>['app'];
  let services: ReturnType<typeof createApp>['services'];

  beforeEach(async () => {
    const created = createApp();
    app = created.app;
    services = created.services;
    await seedSampleData(services);
  });

  it('GET /api/health returns health status and WebMCP capabilities', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.status).toBe('healthy');
    expect(json.webmcp).toBeDefined();
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
  });

  it('GET /api/tools returns seeded active tools', async () => {
    const res = await app.request('/api/tools');
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.length).toBeGreaterThanOrEqual(2);
    expect(json.data.some((t: { toolId: string }) => t.toolId === 'tool_refund_customer')).toBe(
      true,
    );
  });

  it('POST /api/tool-proposals allows autonomous execution for low/medium risk tool', async () => {
    const res = await app.request('/api/tool-proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proposalId: 'prop_auto_1',
        toolId: 'tool_update_customer',
        toolVersion: 1,
        arguments: { customerId: 'cust_123', email: 'updated@example.com' },
        requestId: 'req_auto_1',
        proposedBy: { agentId: 'autonomous_agent', origin: 'http://localhost:5173' },
        timestamp: new Date().toISOString(),
      }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.decision).toBe('ALLOW');
    expect(json.execution.success).toBe(true);
    expect(json.execution.output.status).toBe('UPDATED');
  });

  it('POST /api/tool-proposals requires human authorization for high-risk refund tool', async () => {
    const res = await app.request('/api/tool-proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proposalId: 'prop_high_risk_1',
        toolId: 'tool_refund_customer',
        toolVersion: 1,
        arguments: { customerId: 'cust_999', amount: 5000, reason: 'unauthorized transaction' },
        requestId: 'req_high_risk_1',
        proposedBy: { agentId: 'agent_financial', origin: 'http://localhost:5173' },
        timestamp: new Date().toISOString(),
      }),
    });

    expect(res.status).toBe(202); // 202 Accepted, requires authorization
    const json = await res.json();
    expect(json.decision).toBe('REQUIRE_HUMAN_AUTHORIZATION');
    expect(json.requirement.argumentDigest).toBeDefined();
    expect(json.requirement.riskLevel).toBe('HIGH');
  });

  it('POST /api/authorizations binds authorization and allows exact execution', async () => {
    const targetArgs = { customerId: 'cust_999', amount: 5000, reason: 'unauthorized transaction' };
    const digest = computeArgumentDigest(targetArgs);

    // 1. Grant authorization
    const authRes = await app.request('/api/authorizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorizationId: 'auth_grant_01',
        requestId: 'req_bound_execution_1',
        toolId: 'tool_refund_customer',
        toolVersion: 1,
        argumentDigest: digest,
        authorizationMethod: 'HUMAN_EXPLICIT',
        actor: { id: 'finance_lead', email: 'finance@deputy.internal', role: 'finance_manager' },
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 300000).toISOString(),
        nonce: 'nonce_secure_random_64_bit_token_hex',
        status: 'AUTHORIZED',
      }),
    });

    expect(authRes.status).toBe(201);

    // 2. Submit proposal with matching authorization
    const execRes = await app.request('/api/tool-proposals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-deputy-authorization-id': 'auth_grant_01',
      },
      body: JSON.stringify({
        proposalId: 'prop_authorized_1',
        toolId: 'tool_refund_customer',
        toolVersion: 1,
        arguments: targetArgs,
        requestId: 'req_bound_execution_1',
        proposedBy: { agentId: 'agent_financial', origin: 'http://localhost:5173' },
        timestamp: new Date().toISOString(),
      }),
    });

    expect(execRes.status).toBe(200);
    const execJson = await execRes.json();
    expect(execJson.decision).toBe('ALLOW');
    expect(execJson.execution.success).toBe(true);
    expect(execJson.execution.output.status).toBe('PROCESSED');
  });

  it('POST /api/tool-proposals refuses execution if arguments are tampered after authorization', async () => {
    const originalArgs = {
      customerId: 'cust_999',
      amount: 5000,
      reason: 'unauthorized transaction',
    };
    const digest = computeArgumentDigest(originalArgs);

    await app.request('/api/authorizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorizationId: 'auth_tamper_test',
        requestId: 'req_tamper_1',
        toolId: 'tool_refund_customer',
        toolVersion: 1,
        argumentDigest: digest,
        authorizationMethod: 'HUMAN_EXPLICIT',
        actor: { id: 'finance_lead', role: 'finance_manager' },
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 300000).toISOString(),
        nonce: 'nonce_tamper_random_nonce_12345678',
        status: 'AUTHORIZED',
      }),
    });

    // Propose execution with altered amount (e.g. 999999 instead of 5000)
    const tamperedRes = await app.request('/api/tool-proposals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-deputy-authorization-id': 'auth_tamper_test',
      },
      body: JSON.stringify({
        proposalId: 'prop_tampered_attack',
        toolId: 'tool_refund_customer',
        toolVersion: 1,
        arguments: { customerId: 'cust_999', amount: 999999, reason: 'unauthorized transaction' },
        requestId: 'req_tamper_1',
        proposedBy: { agentId: 'adversarial_agent', origin: 'http://localhost:5173' },
        timestamp: new Date().toISOString(),
      }),
    });

    expect(tamperedRes.status).toBe(403);
    const tamperedJson = await tamperedRes.json();
    expect(tamperedJson.decision).toBe('DENY');
    expect(tamperedJson.reason).toContain('Argument digest mismatch');
  });

  it('GET /api/audit records all system activities immutably', async () => {
    const res = await app.request('/api/audit');
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.length).toBeGreaterThanOrEqual(1);
    expect(json.data.some((e: { eventType: string }) => e.eventType === 'TOOL_REGISTERED')).toBe(
      true,
    );
  });
});
