import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
  RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { WebAuthnCredential } from '@deputy/domain';

export interface WebAuthnServerConfig {
  rpName: string;
  rpID: string;
  expectedOrigin: string | string[];
}

export class WebAuthnService {
  private config: WebAuthnServerConfig;

  constructor(config?: Partial<WebAuthnServerConfig>) {
    this.config = {
      rpName: config?.rpName || 'DEPUTY Authority',
      rpID: config?.rpID || 'localhost',
      expectedOrigin: config?.expectedOrigin || [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:4000',
        'http://127.0.0.1:4000',
      ],
    };
  }

  /**
   * Generate registration options for a new passkey.
   */
  public async generateRegistrationOptions(params: {
    actorId: string;
    userName: string;
    userDisplayName: string;
    excludeCredentials?: { id: string; transports?: string[] }[];
  }) {
    const { actorId, userName, userDisplayName, excludeCredentials } = params;

    return generateRegistrationOptions({
      rpName: this.config.rpName,
      rpID: this.config.rpID,
      userID: new Uint8Array(Buffer.from(actorId, 'utf8')),
      userName,
      userDisplayName,
      attestationType: 'none',
      excludeCredentials: excludeCredentials?.map(c => ({
        id: c.id,
        transports: c.transports as AuthenticatorTransportFuture[] | undefined,
      })),
      authenticatorSelection: {
        userVerification: 'required',
        residentKey: 'preferred',
      },
    });
  }

  /**
   * Verify registration response from authenticator.
   */
  public async verifyRegistration(params: {
    response: RegistrationResponseJSON;
    expectedChallenge: string;
  }) {
    const { response, expectedChallenge } = params;

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: this.config.expectedOrigin,
      expectedRPID: this.config.rpID,
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new Error('WebAuthn registration verification failed.');
    }

    const { credential, aaguid } = verification.registrationInfo;

    return {
      verified: true,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString('base64url'),
      counter: credential.counter,
      aaguid,
    };
  }

  /**
   * Generate authentication options bound to a specific cryptographic challenge.
   */
  public async generateAuthenticationOptions(params: {
    challenge: string;
    allowCredentials?: { id: string; transports?: string[] }[];
    requireUserVerification?: boolean;
  }) {
    const { challenge, allowCredentials, requireUserVerification = true } = params;

    const options = await generateAuthenticationOptions({
      rpID: this.config.rpID,
      allowCredentials: allowCredentials?.map(c => ({
        id: c.id,
        transports: c.transports as AuthenticatorTransportFuture[] | undefined,
      })),
      userVerification: requireUserVerification ? 'required' : 'preferred',
    });

    // Override generated challenge with our deterministic bound challenge
    options.challenge = challenge;

    return options;
  }

  /**
   * Verify an authentication assertion against a registered credential.
   */
  public async verifyAuthentication(params: {
    response: AuthenticationResponseJSON;
    expectedChallenge: string;
    credential: WebAuthnCredential;
    requireUserVerification?: boolean;
  }) {
    const { response, expectedChallenge, credential, requireUserVerification = true } = params;

    // Check credential revocation
    if (credential.revokedAt) {
      throw new Error(`WebAuthn credential '${credential.credentialId}' has been revoked.`);
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: this.config.expectedOrigin,
      expectedRPID: this.config.rpID,
      credential: {
        id: credential.credentialId,
        publicKey: new Uint8Array(Buffer.from(credential.publicKey, 'base64url')),
        counter: credential.counter,
        transports: credential.transports as AuthenticatorTransportFuture[] | undefined,
      },
      requireUserVerification,
    });

    if (!verification.verified || !verification.authenticationInfo) {
      throw new Error('WebAuthn authentication verification failed.');
    }

    return {
      verified: true,
      newCounter: verification.authenticationInfo.newCounter,
      userVerified: verification.authenticationInfo.userVerified,
    };
  }
}
