import React, { useState } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';
import { ShieldCheck, AlertTriangle, Key, X, CheckCircle2 } from 'lucide-react';

export interface PasskeyAuthModalProps {
  toolId: string;
  toolName: string;
  toolVersion: number;
  riskLevel: string;
  reversibility: string;
  arguments: Record<string, unknown>;
  requestId: string;
  onAuthorized: (authorizationId: string) => void;
  onCancel: () => void;
}

export const PasskeyAuthModal: React.FC<PasskeyAuthModalProps> = ({
  toolId,
  toolName,
  toolVersion,
  riskLevel,
  reversibility,
  arguments: args,
  requestId,
  onAuthorized,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAuthorizeWithPasskey = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Request cryptographically bound WebAuthn challenge from server
      const challengeRes = await fetch('/api/auth/webauthn/authorize/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId,
          toolVersion,
          arguments: args,
          requestId,
          actorId: 'usr_ops_lead',
        }),
      });

      const challengeData = await challengeRes.json();
      if (!challengeRes.ok) {
        throw new Error(challengeData.error?.message || 'Failed to generate WebAuthn challenge');
      }

      const { authorizationId, options } = challengeData.data;

      // 2. Invoke browser native WebAuthn passkey ceremony (User Verification required)
      const authResponse = await startAuthentication({ optionsJSON: options });

      // 3. Send authenticator assertion to server for cryptographic verification
      const verifyRes = await fetch('/api/auth/webauthn/authorize/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorizationId,
          response: authResponse,
          credentialId: authResponse.id,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error?.message || 'WebAuthn assertion verification failed');
      }

      setSuccess(true);
      setTimeout(() => {
        onAuthorized(authorizationId);
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        className="card"
        style={{
          width: '540px',
          maxWidth: '90vw',
          background: 'var(--card-bg)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          padding: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={20} color="#38bdf8" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Human Authority Verification</h3>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            marginBottom: '16px',
            background: 'rgba(56, 189, 248, 0.05)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(56, 189, 248, 0.15)',
          }}
        >
          <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '8px' }}>
            An autonomous agent has proposed the following high-privilege action. Your hardware
            passkey assertion will cryptographically bind to this <strong>exact</strong> set of
            parameters.
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className={`badge badge-risk-${riskLevel.toLowerCase()}`}>Risk: {riskLevel}</span>
            <span className={`badge badge-${reversibility.toLowerCase()}`}>{reversibility}</span>
            <span className="badge badge-secondary mono">v{toolVersion}</span>
          </div>
        </div>

        {/* Proposed Operation Summary */}
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              color: '#64748b',
              fontWeight: 700,
              marginBottom: '6px',
            }}
          >
            Target Capability & Arguments
          </div>
          <div
            style={{
              background: '#090d16',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div
              style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}
            >
              {toolName} ({toolId})
            </div>
            <pre
              className="mono"
              style={{
                margin: 0,
                fontSize: '0.8rem',
                color: '#38bdf8',
                maxHeight: '140px',
                overflowY: 'auto',
              }}
            >
              {JSON.stringify(args, null, 2)}
            </pre>
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '18px' }}>
          <strong>Invariant Notice:</strong> This authorization is single-use and valid for exactly
          5 minutes. Any subsequent mutation of parameters will mathematically break the signature.
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#ef4444',
              marginBottom: '16px',
              fontSize: '0.82rem',
            }}
          >
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#10b981',
              marginBottom: '16px',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={18} />
            Passkey assertion verified! Executing action...
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading || success}>
            Reject
          </button>
          <button
            className="btn btn-primary"
            onClick={handleAuthorizeWithPasskey}
            disabled={loading || success}
            style={{ gap: '8px' }}
          >
            <ShieldCheck size={16} />
            {loading ? 'Authenticating...' : 'Authorize with Passkey (UV)'}
          </button>
        </div>
      </div>
    </div>
  );
};
