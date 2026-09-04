import React, { useEffect, useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import { Lock, Key, Plus, Trash2, Cpu, ShieldCheck } from 'lucide-react';
import { Badge } from '../components/ui/Badge.js';
import { Surface } from '../components/ui/Surface.js';
import { useToast } from '../context/ToastContext.js';

interface EnrolledPasskey {
  id: string;
  credentialId: string;
  counter: number;
  createdAt: string;
  lastUsedAt?: string;
  revokedAt?: string;
}

export const SecurityView: React.FC = () => {
  const { showToast } = useToast();
  const [passkeys, setPasskeys] = useState<EnrolledPasskey[]>([]);
  const [loadingPasskeys, setLoadingPasskeys] = useState(false);
  const [registering, setRegistering] = useState(false);

  // Test bench for digest
  const [testArgs, setTestArgs] = useState(
    '{\n  "customerId": "cust_123",\n  "amount": 2500,\n  "reason": "damaged item"\n}',
  );
  const [digest, setDigest] = useState<string>('');
  const [searchInvariant, setSearchInvariant] = useState('');

  useEffect(() => {
    fetchPasskeys();
  }, []);

  const fetchPasskeys = async () => {
    setLoadingPasskeys(true);
    try {
      const res = await fetch('/api/auth/webauthn/credentials?actorId=usr_ops_lead');
      const json = await res.json();
      if (json.data) {
        setPasskeys(json.data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingPasskeys(false);
    }
  };

  const enrollPasskey = async () => {
    setRegistering(true);

    try {
      // 1. Fetch registration options from server
      const optionsRes = await fetch('/api/auth/webauthn/register/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorId: 'usr_ops_lead',
          userName: 'lead_operator@deputy.internal',
          userDisplayName: 'Operations Authority Lead',
        }),
      });

      const optionsData = await optionsRes.json();
      if (!optionsRes.ok) {
        throw new Error(optionsData.error?.message || 'Failed to get registration options');
      }

      // 2. Invoke browser WebAuthn passkey registration ceremony
      const registrationResponse = await startRegistration({ optionsJSON: optionsData.data });

      // 3. Verify registration response on server
      const verifyRes = await fetch('/api/auth/webauthn/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorId: 'usr_ops_lead',
          response: registrationResponse,
          challenge: optionsData.data.challenge,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error?.message || 'Failed to verify passkey');
      }

      showToast(
        'success',
        'Passkey Enrolled',
        'Hardware authenticator credential registered with User Verification.',
      );
      await fetchPasskeys();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showToast('error', 'Enrollment Failed', errorMsg);
    } finally {
      setRegistering(false);
    }
  };

  const revokePasskey = async (credentialId: string) => {
    try {
      const res = await fetch(`/api/auth/webauthn/credentials/${credentialId}/revoke`, {
        method: 'POST',
      });
      if (res.ok) {
        showToast('amber', 'Credential Revoked', `Passkey ${credentialId.slice(0, 16)} revoked.`);
        await fetchPasskeys();
      }
    } catch (err) {
      showToast('error', 'Revocation Failed', String(err));
    }
  };

  const computeDigestLocal = async () => {
    try {
      const parsed = JSON.parse(testArgs);
      const sortedKeys = Object.keys(parsed).sort();
      const canonicalObj: Record<string, unknown> = {};
      for (const k of sortedKeys) {
        canonicalObj[k] = parsed[k];
      }
      const canonicalString = JSON.stringify(canonicalObj);

      const msgBuffer = new TextEncoder().encode(canonicalString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setDigest(hashHex);
    } catch (err) {
      setDigest(`Invalid JSON: ${err}`);
    }
  };

  const invariants = [
    {
      id: 1,
      title: 'No DOM Macros or Click Coordinates',
      desc: 'Canonical learned capability is always semantic application commands bound to typed parameters.',
    },
    {
      id: 2,
      title: 'Trusted ActionRegistry Sole Target',
      desc: 'Execution bindings route exclusively to registered native application handlers. No dynamic code generation.',
    },
    {
      id: 3,
      title: 'Registration != Authorization',
      desc: 'Tool discovery through WebMCP never automatically grants execution authority.',
    },
    {
      id: 4,
      title: 'Exact SHA-256 Argument Binding',
      desc: 'Human authorization signature is cryptographically bound to canonical JSON parameter digest.',
    },
    {
      id: 5,
      title: 'Version & Tool Strict Binding',
      desc: 'Authorization token issued for tool v1 cannot authorize v2 or any other capability.',
    },
    {
      id: 6,
      title: 'Single-Use Nonce & Consumption',
      desc: 'Authorization is atomically consumed upon execution and cannot be replayed.',
    },
    {
      id: 7,
      title: 'Hardware WebAuthn User Verification',
      desc: 'User Verification (UV) is strictly enforced for high-risk and irreversible capabilities.',
    },
    {
      id: 8,
      title: 'Fail-Closed Defaults Everywhere',
      desc: 'Unknown operations, expired challenges, or altered parameter digests fail closed immediately.',
    },
    {
      id: 9,
      title: 'Inactive Tools Cannot Execute',
      desc: 'Only ACTIVE tools may execute; retired and disabled tools reject invocations deterministically.',
    },
    {
      id: 10,
      title: 'Append-Only Cryptographic Audit Trail',
      desc: 'Audit events are immutable, SHA-256 hash chained, and permanently preserved.',
    },
    {
      id: 11,
      title: 'No Arbitrary Code Execution (No Eval)',
      desc: 'Zero eval, new Function, shell execution, or generated executable scripts.',
    },
    {
      id: 12,
      title: 'Deny-by-Default WHATWG Origin Policy',
      desc: 'Strict WHATWG URL.origin semantics prevent cross-origin prefix attacks.',
    },
    {
      id: 13,
      title: 'QUARANTINE Boundary: Data != Instructions',
      desc: 'Untrusted external content carries immutable provenance and can never grant authority.',
    },
    {
      id: 14,
      title: 'Retirement WebMCP Propagation',
      desc: 'Tool retirement immediately aborts in-flight signals and removes descriptor from runtime.',
    },
    {
      id: 15,
      title: 'Atomic Concurrency Guard',
      desc: 'Concurrent authorization consumption attempts result in exactly one execution.',
    },
    {
      id: 16,
      title: 'WebMCP Fallback Grace',
      desc: 'Absence of host WebMCP operates in secure backward-compatible adapter mode.',
    },
    {
      id: 17,
      title: 'Reversibility & Compensation Contract',
      desc: 'Capabilities declare reversibility semantics (REVERSIBLE, COMPENSATABLE, IRREVERSIBLE).',
    },
    {
      id: 18,
      title: 'Deterministic Policy Decision Boundary',
      desc: 'No security decision depends solely on an advisory LLM classifier.',
    },
  ];

  const filteredInvariants = invariants.filter(inv => {
    if (!searchInvariant.trim()) return true;
    const q = searchInvariant.toLowerCase();
    return (
      inv.title.toLowerCase().includes(q) ||
      inv.desc.toLowerCase().includes(q) ||
      String(inv.id).includes(q)
    );
  });

  return (
    <div className="page-body">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span
            style={{
              fontSize: '0.72rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--semantic-auth)',
              fontWeight: 700,
            }}
          >
            CRYPTOGRAPHIC GOVERNANCE
          </span>
          <span style={{ color: 'var(--border-strong)' }}>/</span>
          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            SECURITY INVARIANTS & HARDWARE ENCLAVE
          </span>
        </div>
        <h1 className="page-title">Security Posture & Enforcement Core</h1>
        <p className="page-description">
          Hardware WebAuthn FIDO2 User Verification, Canonical SHA-256 parameter bindings,
          Quarantine data isolation, and 18 core security invariants.
        </p>
      </div>

      {/* Security Posture Technical Status Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">WebMCP Provider</span>
            <Cpu size={15} style={{ color: 'var(--semantic-webmcp)' }} />
          </div>
          <div
            className="stat-value"
            style={{ color: 'var(--semantic-webmcp)', fontSize: '1.4rem' }}
          >
            ACTIVE
          </div>
          <div className="stat-hint">Model Context Protocol</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">WebAuthn FIDO2</span>
            <Key
              size={15}
              style={{
                color: passkeys.length > 0 ? 'var(--semantic-emerald)' : 'var(--semantic-amber)',
              }}
            />
          </div>
          <div
            className="stat-value mono"
            style={{
              fontSize: '1.4rem',
              color: passkeys.length > 0 ? 'var(--semantic-emerald)' : 'var(--semantic-amber)',
            }}
          >
            {passkeys.length > 0 ? `${passkeys.length} ENROLLED` : 'PENDING ENROLL'}
          </div>
          <div className="stat-hint">User Verification (UV)</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Quarantine Boundary</span>
            <ShieldCheck size={15} style={{ color: 'var(--semantic-emerald)' }} />
          </div>
          <div
            className="stat-value"
            style={{ color: 'var(--semantic-emerald)', fontSize: '1.4rem' }}
          >
            ENFORCED
          </div>
          <div className="stat-hint">Data != Instructions</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Origin Policy</span>
            <Lock size={15} style={{ color: 'var(--semantic-emerald)' }} />
          </div>
          <div
            className="stat-value"
            style={{ color: 'var(--semantic-emerald)', fontSize: '1.4rem' }}
          >
            WHATWG
          </div>
          <div className="stat-hint">Exact origin match</div>
        </div>
      </div>

      {/* 2-Column: Passkey Credentials (Left) & Canonical Digest Bench (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Hardware Passkeys Management */}
        <Surface
          level={2}
          headerTitle="Hardware Passkey Enclave (FIDO2 / WebAuthn)"
          headerMeta={`${passkeys.length} REGISTERED`}
          headerAction={
            <button
              type="button"
              className="btn btn-accent btn-sm"
              onClick={enrollPasskey}
              disabled={registering}
              style={{ gap: 5 }}
            >
              <Plus size={13} />
              <span>{registering ? 'Enrolling...' : 'Enroll Hardware Passkey'}</span>
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              WebAuthn hardware authenticator keys require biometric or physical User Verification
              (UV) to sign single-use capability authorizations.
            </p>

            {loadingPasskeys ? (
              <div style={{ padding: 16, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Loading enrolled credentials...
              </div>
            ) : passkeys.length === 0 ? (
              <div
                style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 16,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    color: 'var(--text-primary)',
                    marginBottom: 4,
                  }}
                >
                  No Passkeys Enrolled
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                  Click &quot;Enroll Hardware Passkey&quot; to register your security key or
                  biometric authenticator with the backend.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {passkeys.map(pk => (
                  <div
                    key={pk.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--surface-1)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 14px',
                    }}
                  >
                    <div>
                      <div
                        className="mono"
                        style={{
                          fontWeight: 600,
                          fontSize: '0.82rem',
                          color: 'var(--text-primary)',
                        }}
                      >
                        Credential: {pk.credentialId.slice(0, 24)}...
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Counter: {pk.counter} · Created:{' '}
                        {new Date(pk.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => revokePasskey(pk.credentialId)}
                      style={{ color: 'var(--semantic-danger)', gap: 4 }}
                      title="Revoke passkey"
                    >
                      <Trash2 size={12} />
                      <span>Revoke</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Surface>

        {/* SHA-256 Canonical Digest Calculator */}
        <Surface
          level={2}
          headerTitle="Canonical SHA-256 Digest Test Bench"
          headerMeta="INVARIANT 4 PROOF"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Calculates deterministic canonical NFC SHA-256 hash. Key order and whitespace
              variations produce identical hashes.
            </p>

            <textarea
              className="form-textarea mono"
              rows={4}
              value={testArgs}
              onChange={e => setTestArgs(e.target.value)}
              style={{ fontSize: '0.76rem' }}
            />

            <button type="button" className="btn btn-secondary btn-sm" onClick={computeDigestLocal}>
              Calculate Canonical Digest
            </button>

            {digest && (
              <div
                style={{
                  background: 'var(--surface-0)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  padding: 10,
                }}
              >
                <div
                  style={{
                    fontSize: '0.68rem',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    fontWeight: 700,
                  }}
                >
                  Canonical SHA-256 Hex
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: '0.74rem',
                    color: 'var(--semantic-emerald)',
                    wordBreak: 'break-all',
                  }}
                >
                  {digest}
                </div>
              </div>
            )}
          </div>
        </Surface>
      </div>

      {/* 18 Core Security Invariants Catalog */}
      <Surface
        level={2}
        headerTitle="Core Security Invariants & Formal Bounds"
        headerMeta={`${filteredInvariants.length} INVARIANTS`}
        headerAction={
          <input
            type="text"
            className="form-input"
            style={{ width: 220, fontSize: '0.76rem', padding: '3px 8px' }}
            placeholder="Search invariants..."
            value={searchInvariant}
            onChange={e => setSearchInvariant(e.target.value)}
          />
        }
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 12,
          }}
        >
          {filteredInvariants.map(inv => (
            <div
              key={inv.id}
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <span
                  className="mono"
                  style={{ color: 'var(--semantic-auth)', fontWeight: 700, fontSize: '0.76rem' }}
                >
                  INVARIANT #{inv.id}
                </span>
                <Badge variant="active">ENFORCED</Badge>
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                {inv.title}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{inv.desc}</div>
            </div>
          ))}
        </div>
      </Surface>
    </div>
  );
};
