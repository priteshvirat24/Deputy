import React, { useState } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';
import { ShieldCheck, AlertTriangle, Key, X, CheckCircle2, Lock } from 'lucide-react';
import { Badge } from './ui/Badge.js';

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

type CeremonyStep = 'REVIEW' | 'VERIFY' | 'AUTHORIZED' | 'EXECUTE' | 'COMPLETE';

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
  const [step, setStep] = useState<CeremonyStep>('REVIEW');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [computedDigest, setComputedDigest] = useState<string>('');

  const handleAuthorizeWithPasskey = async () => {
    setLoading(true);
    setError(null);
    setStep('VERIFY');

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

      const { authorizationId, options, argumentDigest } = challengeData.data;
      setComputedDigest(argumentDigest);

      // 2. Invoke native browser WebAuthn passkey ceremony with User Verification
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

      setStep('AUTHORIZED');

      setTimeout(() => {
        setStep('EXECUTE');
        setTimeout(() => {
          setStep('COMPLETE');
          setTimeout(() => {
            onAuthorized(authorizationId);
          }, 600);
        }, 600);
      }, 600);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setStep('REVIEW');
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    { key: 'REVIEW', label: '1. Review' },
    { key: 'VERIFY', label: '2. Verify (UV)' },
    { key: 'AUTHORIZED', label: '3. Authorized' },
    { key: 'EXECUTE', label: '4. Execute' },
    { key: 'COMPLETE', label: '5. Complete' },
  ];

  return (
    <div
      className="drawer-backdrop"
      style={{ justifyContent: 'center', alignItems: 'center', padding: 20 }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="panel"
        style={{
          width: 560,
          maxWidth: '92vw',
          marginBottom: 0,
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-auth)',
          background: 'var(--surface-2)',
        }}
      >
        {/* Header */}
        <div className="panel-header" style={{ background: 'var(--surface-1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={17} style={{ color: 'var(--semantic-auth)' }} />
            <div>
              <span className="panel-title" style={{ fontSize: '1rem' }}>
                Transaction Authorization Ceremony
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onCancel}
            disabled={loading && step !== 'REVIEW'}
          >
            <X size={15} />
          </button>
        </div>

        {/* 5-Step Visual Progression Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 20px',
            background: 'var(--surface-1)',
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: '0.74rem',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {stepsList.map((s, idx) => {
            const isCurrent = step === s.key;
            const isPast =
              (step === 'VERIFY' && idx < 1) ||
              (step === 'AUTHORIZED' && idx < 2) ||
              (step === 'EXECUTE' && idx < 3) ||
              (step === 'COMPLETE' && idx < 4);

            return (
              <div
                key={s.key}
                style={{
                  color: isCurrent
                    ? 'var(--semantic-auth)'
                    : isPast
                      ? 'var(--semantic-emerald)'
                      : 'var(--text-muted)',
                  fontWeight: isCurrent ? 700 : 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {isPast && <CheckCircle2 size={11} />}
                <span>{s.label}</span>
              </div>
            );
          })}
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Exact Operation Notice */}
          <div>
            <div
              style={{
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              YOU ARE AUTHORIZING EXACT OPERATION
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: 'var(--surface-1)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 10,
              }}
            >
              <div>
                <span
                  className="mono"
                  style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}
                >
                  {toolName}
                </span>
                <span
                  className="mono"
                  style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginLeft: 8 }}
                >
                  ({toolId}@v{toolVersion})
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Badge variant={`risk-${riskLevel.toLowerCase()}` as any}>{riskLevel}</Badge>
                <Badge variant={reversibility.toLowerCase() as any}>{reversibility}</Badge>
              </div>
            </div>
          </div>

          {/* Exact Argument Parameter Mapping */}
          <div>
            <div
              style={{
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              BOUND ARGUMENT SET
            </div>
            <pre
              className="mono"
              style={{
                background: 'var(--surface-0)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: 12,
                fontSize: '0.76rem',
                color: 'var(--semantic-audit)',
                maxHeight: 140,
                overflowY: 'auto',
                margin: 0,
              }}
            >
              {JSON.stringify(args, null, 2)}
            </pre>
          </div>

          {/* Cryptographic SHA-256 Binding Notice */}
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid var(--border-auth)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              fontSize: '0.76rem',
              color: 'var(--text-secondary)',
            }}
          >
            <div
              style={{
                fontWeight: 600,
                color: 'var(--semantic-auth)',
                marginBottom: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Lock size={12} />
              <span>SHA-256 ARGUMENT BINDING (Invariant 4)</span>
            </div>
            <div>
              Your hardware authenticator signature will bind to the canonical digest of this exact
              parameter set. Any subsequent parameter modification causes deterministic rejection.
            </div>
            {computedDigest && (
              <div
                className="mono"
                style={{ fontSize: '0.72rem', color: 'var(--semantic-emerald)', marginTop: 4 }}
              >
                Digest: {computedDigest.slice(0, 32)}...
              </div>
            )}
          </div>

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--semantic-danger)',
                fontSize: '0.82rem',
              }}
            >
              <AlertTriangle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Action Ceremony Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading && step !== 'REVIEW'}
            >
              Reject Proposal
            </button>

            <button
              type="button"
              className="btn btn-accent"
              onClick={handleAuthorizeWithPasskey}
              disabled={loading || step === 'COMPLETE'}
              style={{ gap: 7, padding: '8px 16px' }}
            >
              <ShieldCheck size={15} />
              <span>
                {step === 'VERIFY'
                  ? 'Prompting Authenticator (UV)...'
                  : step === 'AUTHORIZED'
                    ? 'Assertion Verified!'
                    : step === 'EXECUTE'
                      ? 'Executing Action...'
                      : 'Authorize with Passkey'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
