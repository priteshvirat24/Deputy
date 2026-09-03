import { randomUUID } from 'node:crypto';
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/server';
import { Hono } from 'hono';
import { Authorization, WebAuthnCredential } from '@deputy/domain';
import { computeArgumentDigest, computeBoundChallenge } from '@deputy/security';
import { AppServices } from '../services/index.js';

export function createWebAuthnRoutes(services: AppServices) {
  const router = new Hono();
  const {
    webauthnRepo,
    webauthnService,
    authorizationRepo,
    toolRepo,
    auditRepo,
    nonceManager,
    activeChallenges,
  } = services;

  /**
   * POST /api/auth/webauthn/register/options
   * Generate registration options for passkey enrollment.
   */
  router.post('/register/options', async c => {
    const body = await c.req.json().catch(() => ({}));
    const {
      actorId = 'usr_ops_lead',
      userName = 'operator@deputy.internal',
      userDisplayName = 'Operations Authority',
    } = body;

    const existingCreds = await webauthnRepo.findByActorId(actorId);
    const options = await webauthnService.generateRegistrationOptions({
      actorId,
      userName,
      userDisplayName,
      excludeCredentials: existingCreds.map(cr => ({
        id: cr.credentialId,
        transports: cr.transports,
      })),
    });

    // Cache challenge with 5m expiry
    activeChallenges.set(options.challenge, {
      challenge: options.challenge,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      actorId,
    });

    return c.json({ success: true, data: options });
  });

  /**
   * POST /api/auth/webauthn/register/verify
   * Verify authenticator registration response and save credential.
   */
  router.post('/register/verify', async c => {
    const body = await c.req.json().catch(() => ({}));
    const { actorId = 'usr_ops_lead', response, challenge } = body;

    if (!response || !challenge) {
      return c.json(
        {
          success: false,
          error: { code: 'INVALID_REQUEST', message: 'Missing response or challenge' },
        },
        400,
      );
    }

    const cached = activeChallenges.get(challenge);
    if (!cached || new Date() > cached.expiresAt) {
      activeChallenges.delete(challenge);
      return c.json(
        {
          success: false,
          error: {
            code: 'CHALLENGE_EXPIRED',
            message: 'Registration challenge has expired or does not exist.',
          },
        },
        400,
      );
    }
    activeChallenges.delete(challenge);

    const verification = await webauthnService.verifyRegistration({
      response: response as RegistrationResponseJSON,
      expectedChallenge: challenge,
    });

    const newCred: WebAuthnCredential = {
      id: `cred_${randomUUID()}`,
      actorId,
      credentialId: verification.credentialId,
      publicKey: verification.publicKey,
      counter: verification.counter,
      transports: (response as { response?: { transports?: string[] } }).response?.transports,
      aaguid: verification.aaguid,
      createdAt: new Date(),
    };

    await webauthnRepo.create(newCred);

    await auditRepo.append({
      eventId: `aud_${randomUUID()}`,
      timestamp: new Date(),
      eventType: 'WEBAUTHN_REGISTERED',
      actor: { id: actorId, type: 'HUMAN', role: 'OPERATIONS_LEAD' },
      status: 'SUCCESS',
      reason: `Passkey enrolled: ${newCred.credentialId.slice(0, 16)}...`,
      provenance: {
        source: 'security.console',
        origin: 'http://localhost:5173',
        trustClass: 'FIRST_PARTY',
        retrievedAt: new Date(),
        contentId: `cid_reg_${newCred.id}`,
      },
      metadata: { credentialId: newCred.credentialId, aaguid: newCred.aaguid },
    });

    return c.json({ success: true, data: { verified: true, credential: newCred } });
  });

  /**
   * GET /api/auth/webauthn/credentials
   * List enrolled passkeys for current actor.
   */
  router.get('/credentials', async c => {
    const actorId = c.req.query('actorId') || 'usr_ops_lead';
    const creds = await webauthnRepo.findByActorId(actorId);
    const safe = creds.map(cr => ({
      id: cr.id,
      credentialId: cr.credentialId,
      counter: cr.counter,
      createdAt: cr.createdAt,
      lastUsedAt: cr.lastUsedAt,
      revokedAt: cr.revokedAt,
    }));
    return c.json({ success: true, data: safe });
  });

  /**
   * POST /api/auth/webauthn/credentials/:id/revoke
   * Revoke an active passkey.
   */
  router.post('/credentials/:id/revoke', async c => {
    const id = c.req.param('id');
    const all = await webauthnRepo.listAll();
    const target = all.find(cr => cr.id === id || cr.credentialId === id);
    if (!target) {
      return c.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Credential not found' } },
        404,
      );
    }

    await webauthnRepo.revoke(target.credentialId);

    await auditRepo.append({
      eventId: `aud_${randomUUID()}`,
      timestamp: new Date(),
      eventType: 'WEBAUTHN_CREDENTIAL_REVOKED',
      actor: { id: target.actorId, type: 'HUMAN', role: 'OPERATIONS_LEAD' },
      status: 'SUCCESS',
      reason: `Credential revoked: ${target.credentialId.slice(0, 16)}...`,
      provenance: {
        source: 'security.console',
        origin: 'http://localhost:5173',
        trustClass: 'FIRST_PARTY',
        retrievedAt: new Date(),
        contentId: `cid_rev_${target.id}`,
      },
      metadata: { credentialId: target.credentialId },
    });

    return c.json({ success: true, message: 'Credential successfully revoked.' });
  });

  /**
   * POST /api/auth/webauthn/authorize/challenge
   * Generates a WebAuthn authentication challenge cryptographically bound
   * to the exact tool invocation and exact canonical arguments.
   */
  router.post('/authorize/challenge', async c => {
    const body = await c.req.json().catch(() => ({}));
    const { toolId, toolVersion, arguments: args, requestId, actorId = 'usr_ops_lead' } = body;

    if (!toolId || !args || !requestId) {
      return c.json(
        {
          success: false,
          error: { code: 'INVALID_REQUEST', message: 'Missing toolId, arguments, or requestId.' },
        },
        400,
      );
    }

    const tool = await toolRepo.getById(toolId);
    if (!tool) {
      return c.json(
        {
          success: false,
          error: { code: 'TOOL_NOT_FOUND', message: `Tool '${toolId}' not found.` },
        },
        404,
      );
    }

    if (tool.status !== 'ACTIVE') {
      return c.json(
        {
          success: false,
          error: {
            code: 'TOOL_NOT_ACTIVE',
            message: `Tool '${toolId}' is in state '${tool.status}'.`,
          },
        },
        400,
      );
    }

    // 1. Exact canonical argument digest (Invariant 4)
    const argumentDigest = computeArgumentDigest(args);
    const nonce = nonceManager.generateNonce();

    // 2. Cryptographically bound challenge calculation
    const boundChallenge = computeBoundChallenge({
      toolId: tool.toolId,
      toolVersion: toolVersion || tool.version,
      argumentDigest,
      requestId,
      nonce,
    });

    // 3. Find registered passkeys
    const creds = await webauthnRepo.findByActorId(actorId);
    if (creds.length === 0) {
      return c.json(
        {
          success: false,
          error: {
            code: 'NO_PASSKEYS_ENROLLED',
            message: 'No registered passkeys found for actor. Please enroll a passkey first.',
          },
        },
        400,
      );
    }

    // 4. Generate WebAuthn options
    const options = await webauthnService.generateAuthenticationOptions({
      challenge: boundChallenge,
      allowCredentials: creds.map(cr => ({ id: cr.credentialId, transports: cr.transports })),
      requireUserVerification: true,
    });

    // 5. Store pending Authorization record
    const authorizationId = `auth_${randomUUID()}`;
    const authRecord: Authorization = {
      authorizationId,
      requestId,
      toolId: tool.toolId,
      toolVersion: toolVersion || tool.version,
      argumentDigest,
      authorizationMethod: 'WEBAUTHN_UV',
      actor: { id: actorId, role: 'OPERATIONS_LEAD' },
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5m expiry
      nonce,
      status: 'PENDING',
    };

    await authorizationRepo.create(authRecord);

    await auditRepo.append({
      eventId: `aud_${randomUUID()}`,
      timestamp: new Date(),
      eventType: 'WEBAUTHN_CHALLENGE_CREATED',
      actor: { id: actorId, type: 'HUMAN', role: 'OPERATIONS_LEAD' },
      requestId,
      toolId: tool.toolId,
      toolVersion: tool.version,
      status: 'SUCCESS',
      reason: `Cryptographically bound WebAuthn challenge generated for ${tool.name}`,
      provenance: {
        source: 'security.console',
        origin: 'http://localhost:5173',
        trustClass: 'FIRST_PARTY',
        retrievedAt: new Date(),
        contentId: `cid_chal_${authorizationId}`,
      },
      metadata: { authorizationId, argumentDigest },
    });

    return c.json({
      success: true,
      data: {
        authorizationId,
        options,
        argumentDigest,
        toolName: tool.name,
      },
    });
  });

  /**
   * POST /api/auth/webauthn/authorize/verify
   * Verify the WebAuthn assertion and transition authorization to AUTHORIZED.
   */
  router.post('/authorize/verify', async c => {
    const body = await c.req.json().catch(() => ({}));
    const { authorizationId, response, credentialId } = body;

    if (!authorizationId || !response || !credentialId) {
      return c.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing authorizationId, response, or credentialId.',
          },
        },
        400,
      );
    }

    const auth = await authorizationRepo.getById(authorizationId);
    if (!auth) {
      return c.json(
        {
          success: false,
          error: {
            code: 'AUTHORIZATION_NOT_FOUND',
            message: `Authorization '${authorizationId}' not found.`,
          },
        },
        404,
      );
    }

    if (auth.status !== 'PENDING') {
      return c.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Authorization is in state '${auth.status}', expected 'PENDING'.`,
          },
        },
        400,
      );
    }

    if (new Date() > new Date(auth.expiresAt)) {
      await authorizationRepo.updateStatus(auth.authorizationId, 'EXPIRED');
      return c.json(
        {
          success: false,
          error: { code: 'AUTHORIZATION_EXPIRED', message: 'Authorization challenge has expired.' },
        },
        400,
      );
    }

    const cred = await webauthnRepo.findByCredentialId(credentialId);
    if (!cred) {
      return c.json(
        {
          success: false,
          error: {
            code: 'CREDENTIAL_NOT_FOUND',
            message: `Credential '${credentialId}' not found.`,
          },
        },
        404,
      );
    }

    if (cred.revokedAt) {
      return c.json(
        {
          success: false,
          error: { code: 'CREDENTIAL_REVOKED', message: 'Credential has been revoked.' },
        },
        400,
      );
    }

    // Reconstruct the exact expected bound challenge
    const expectedChallenge = computeBoundChallenge({
      toolId: auth.toolId,
      toolVersion: auth.toolVersion,
      argumentDigest: auth.argumentDigest,
      requestId: auth.requestId,
      nonce: auth.nonce,
    });

    const verification = await webauthnService.verifyAuthentication({
      response: response as AuthenticationResponseJSON,
      expectedChallenge,
      credential: cred,
      requireUserVerification: true,
    });

    // Update credential counter
    await webauthnRepo.updateCounter(cred.credentialId, verification.newCounter);

    // Transition authorization to AUTHORIZED
    auth.status = 'AUTHORIZED';
    auth.credentialReference = cred.credentialId;
    auth.webauthnAssertion = {
      credentialId: cred.credentialId,
      clientDataJSON: (response as AuthenticationResponseJSON).response.clientDataJSON,
      authenticatorData: (response as AuthenticationResponseJSON).response.authenticatorData,
      signature: (response as AuthenticationResponseJSON).response.signature,
      userHandle: (response as AuthenticationResponseJSON).response.userHandle,
      userVerified: verification.userVerified,
    };

    await authorizationRepo.updateStatus(auth.authorizationId, 'AUTHORIZED');

    await auditRepo.append({
      eventId: `aud_${randomUUID()}`,
      timestamp: new Date(),
      eventType: 'WEBAUTHN_VERIFIED',
      actor: { id: auth.actor.id, type: 'HUMAN', role: auth.actor.role },
      requestId: auth.requestId,
      toolId: auth.toolId,
      toolVersion: auth.toolVersion,
      status: 'SUCCESS',
      reason: `Passkey authorization verified for tool '${auth.toolId}' with User Verification.`,
      provenance: {
        source: 'security.console',
        origin: 'http://localhost:5173',
        trustClass: 'FIRST_PARTY',
        retrievedAt: new Date(),
        contentId: `cid_ver_${auth.authorizationId}`,
      },
      metadata: { authorizationId: auth.authorizationId, credentialId: cred.credentialId },
    });

    return c.json({
      success: true,
      data: {
        authorized: true,
        authorizationId: auth.authorizationId,
        argumentDigest: auth.argumentDigest,
      },
    });
  });

  return router;
}
