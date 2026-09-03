import { describe, expect, it } from 'vitest';
import { InMemoryAuthorizationRepository, InMemoryWebAuthnRepository } from '@deputy/database';
import { Authorization, WebAuthnCredential } from '@deputy/domain';
import {
  AuthenticationResponseJSON,
  computeArgumentDigest,
  computeBoundChallenge,
  generateRegistrationChallenge,
  WebAuthnService,
} from '@deputy/security';

describe('WebAuthn Server Verification & Challenge Binding (Tests 9–20)', () => {
  const service = new WebAuthnService({ rpName: 'DEPUTY Test', rpID: 'localhost' });
  const authRepo = new InMemoryAuthorizationRepository();
  const credRepo = new InMemoryWebAuthnRepository();

  // Test 9: Registration challenge generation
  it('Test 9: Generates cryptographically strong registration challenge', () => {
    const c1 = generateRegistrationChallenge();
    const c2 = generateRegistrationChallenge();
    expect(c1).toBeDefined();
    expect(c1.length).toBeGreaterThanOrEqual(32);
    expect(c1).not.toBe(c2);
  });

  // Test 10: Authentication challenge bound to exact parameters
  it('Test 10: Challenge is cryptographically bound to (toolId, version, argumentDigest, requestId, nonce)', () => {
    const p1 = {
      toolId: 'tool_invoice',
      toolVersion: 1,
      argumentDigest: computeArgumentDigest({ amount: 2500, customer: 'Alice' }),
      requestId: 'req_001',
      nonce: 'nonce_1234567890123456',
    };

    const c1 = computeBoundChallenge(p1);
    const c2 = computeBoundChallenge(p1);
    expect(c1).toBe(c2); // Deterministic

    // Changing any argument produces a different challenge
    const p2 = {
      ...p1,
      argumentDigest: computeArgumentDigest({ amount: 2501, customer: 'Alice' }),
    };
    const c3 = computeBoundChallenge(p2);
    expect(c1).not.toBe(c3);
  });

  // Test 11: Tool version variation produces different challenge
  it('Test 11: Changing tool version changes bound challenge', () => {
    const digest = computeArgumentDigest({ amount: 2500 });
    const c1 = computeBoundChallenge({
      toolId: 'tool_invoice',
      toolVersion: 1,
      argumentDigest: digest,
      requestId: 'req_1',
      nonce: 'nonce_1234567890123456',
    });
    const c2 = computeBoundChallenge({
      toolId: 'tool_invoice',
      toolVersion: 2,
      argumentDigest: digest,
      requestId: 'req_1',
      nonce: 'nonce_1234567890123456',
    });
    expect(c1).not.toBe(c2);
  });

  // Test 12: Tool ID variation produces different challenge
  it('Test 12: Changing tool ID changes bound challenge', () => {
    const digest = computeArgumentDigest({ amount: 2500 });
    const c1 = computeBoundChallenge({
      toolId: 'tool_invoice',
      toolVersion: 1,
      argumentDigest: digest,
      requestId: 'req_1',
      nonce: 'nonce_1234567890123456',
    });
    const c2 = computeBoundChallenge({
      toolId: 'tool_refund',
      toolVersion: 1,
      argumentDigest: digest,
      requestId: 'req_1',
      nonce: 'nonce_1234567890123456',
    });
    expect(c1).not.toBe(c2);
  });

  // Test 13: Request ID and nonce variation produce different challenges
  it('Test 13: Changing nonce or requestId changes bound challenge', () => {
    const digest = computeArgumentDigest({ amount: 2500 });
    const c1 = computeBoundChallenge({
      toolId: 'tool_invoice',
      toolVersion: 1,
      argumentDigest: digest,
      requestId: 'req_1',
      nonce: 'nonce_1234567890123456',
    });
    const c2 = computeBoundChallenge({
      toolId: 'tool_invoice',
      toolVersion: 1,
      argumentDigest: digest,
      requestId: 'req_2',
      nonce: 'nonce_1234567890123456',
    });
    expect(c1).not.toBe(c2);
  });

  // Test 14: User Verification requirement is enforced in options
  it('Test 14: Enforces userVerification = required in authentication options', async () => {
    const options = await service.generateAuthenticationOptions({
      challenge: 'test_bound_challenge',
      requireUserVerification: true,
    });
    expect(options.userVerification).toBe('required');
    expect(options.challenge).toBe('test_bound_challenge');
  });

  // Test 15: Revoked credential fails verification
  it('Test 15: Revoked credential is immediately rejected by authentication verifier', async () => {
    const revokedCred: WebAuthnCredential = {
      id: 'cred_revoked_1',
      actorId: 'usr_ops',
      credentialId: 'cred_id_revoked',
      publicKey: 'mock_pk',
      counter: 10,
      createdAt: new Date(),
      revokedAt: new Date(),
    };

    await expect(
      service.verifyAuthentication({
        response: {} as AuthenticationResponseJSON,
        expectedChallenge: 'chal',
        credential: revokedCred,
      }),
    ).rejects.toThrow(/revoked/);
  });

  // Test 16: Credential counter tracking
  it('Test 16: Credential repository updates signature counter upon use', async () => {
    const cred: WebAuthnCredential = {
      id: 'cred_active_1',
      actorId: 'usr_ops',
      credentialId: 'cred_id_active_001',
      publicKey: 'mock_pk',
      counter: 5,
      createdAt: new Date(),
    };

    await credRepo.create(cred);
    await credRepo.updateCounter(cred.credentialId, 6);

    const updated = await credRepo.findByCredentialId(cred.credentialId);
    expect(updated?.counter).toBe(6);
    expect(updated?.lastUsedAt).toBeDefined();
  });

  // Test 17: Authorization cannot be reused (single-use consumption)
  it('Test 17: Authorization consumption is strictly single-use', async () => {
    const digest = computeArgumentDigest({ customer: 'Charlie', amount: 4200 });
    const auth: Authorization = {
      authorizationId: 'auth_single_use_01',
      requestId: 'req_charlie_01',
      toolId: 'create_customer_with_invoice',
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

    // 1st consumption: succeeds
    const consumed = await authRepo.consume(auth.authorizationId, 'prop_001', digest);
    expect(consumed.status).toBe('CONSUMED');
    expect(consumed.consumedByProposalId).toBe('prop_001');

    // 2nd consumption: rejected with ALREADY_CONSUMED
    await expect(authRepo.consume(auth.authorizationId, 'prop_002', digest)).rejects.toThrow(
      /ALREADY_CONSUMED/,
    );
  });

  // Test 18: Expired authorization fails consumption
  it('Test 18: Expired authorization cannot be consumed', async () => {
    const digest = computeArgumentDigest({ amount: 100 });
    const expiredAuth: Authorization = {
      authorizationId: 'auth_expired_01',
      requestId: 'req_exp_01',
      toolId: 'tool_test',
      toolVersion: 1,
      argumentDigest: digest,
      authorizationMethod: 'WEBAUTHN_UV',
      actor: { id: 'usr_lead', role: 'admin' },
      issuedAt: new Date(Date.now() - 100000),
      expiresAt: new Date(Date.now() - 1000), // in the past
      nonce: 'nonce_1234567890123456',
      status: 'AUTHORIZED',
    };

    await authRepo.create(expiredAuth);

    await expect(authRepo.consume(expiredAuth.authorizationId, 'prop_001', digest)).rejects.toThrow(
      /AUTHORIZATION_EXPIRED/,
    );
  });

  // Test 19: Argument digest mismatch fails consumption
  it('Test 19: Mutated arguments fail consumption with ARGUMENT_DIGEST_MISMATCH', async () => {
    const authorizedDigest = computeArgumentDigest({ amount: 2500 });
    const tamperedDigest = computeArgumentDigest({ amount: 2501 });

    const auth: Authorization = {
      authorizationId: 'auth_tamper_01',
      requestId: 'req_tamper_01',
      toolId: 'tool_test',
      toolVersion: 1,
      argumentDigest: authorizedDigest,
      authorizationMethod: 'WEBAUTHN_UV',
      actor: { id: 'usr_lead', role: 'admin' },
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 60000),
      nonce: 'nonce_1234567890123456',
      status: 'AUTHORIZED',
    };

    await authRepo.create(auth);

    await expect(
      authRepo.consume(auth.authorizationId, 'prop_tampered', tamperedDigest),
    ).rejects.toThrow(/ARGUMENT_DIGEST_MISMATCH/);
  });

  // Test 20: Pending authorization cannot be consumed without AUTHORIZED status
  it('Test 20: PENDING authorization cannot be consumed until verified', async () => {
    const digest = computeArgumentDigest({ amount: 2500 });
    const pendingAuth: Authorization = {
      authorizationId: 'auth_pending_01',
      requestId: 'req_pending_01',
      toolId: 'tool_test',
      toolVersion: 1,
      argumentDigest: digest,
      authorizationMethod: 'WEBAUTHN_UV',
      actor: { id: 'usr_lead', role: 'admin' },
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 60000),
      nonce: 'nonce_1234567890123456',
      status: 'PENDING',
    };

    await authRepo.create(pendingAuth);

    await expect(
      authRepo.consume(pendingAuth.authorizationId, 'prop_pending', digest),
    ).rejects.toThrow(/AUTHORIZATION_INVALID/);
  });
});
