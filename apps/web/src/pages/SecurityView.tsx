import React, { useEffect, useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import { Shield, Lock, Key, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface EnrolledPasskey {
  id: string;
  credentialId: string;
  counter: number;
  createdAt: string;
  lastUsedAt?: string;
  revokedAt?: string;
}

export const SecurityView: React.FC = () => {
  const [passkeys, setPasskeys] = useState<EnrolledPasskey[]>([]);
  const [loadingPasskeys, setLoadingPasskeys] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Test bench for digest
  const [testArgs, setTestArgs] = useState(
    '{\n  "customerId": "cust_123",\n  "amount": 2500,\n  "reason": "damaged item"\n}',
  );
  const [digest, setDigest] = useState<string>('');

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
    setMsg(null);

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

      setMsg({
        type: 'success',
        text: 'Hardware passkey successfully registered with User Verification!',
      });
      await fetchPasskeys();
    } catch (err: unknown) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : String(err) });
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
        await fetchPasskeys();
      }
    } catch (err) {
      console.error(err);
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
      title: 'No DOM Macros',
      desc: 'Canonical learned capability is always semantic application commands.',
    },
    {
      id: 2,
      title: 'Trusted ActionRegistry Only',
      desc: 'Execution bindings route exclusively to registered handlers.',
    },
    {
      id: 3,
      title: 'Registration != Authorization',
      desc: 'Tool discovery never automatically grants execution authority.',
    },
    {
      id: 4,
      title: 'Exact Argument Binding',
      desc: 'Human authorization is cryptographically bound to canonical SHA-256 digest.',
    },
    {
      id: 5,
      title: 'Version & Tool Binding',
      desc: 'Authorization for tool v1 cannot authorize v2 or any other tool.',
    },
    {
      id: 6,
      title: 'Single-Use Consumption',
      desc: 'Authorization is consumed upon execution and cannot be replayed.',
    },
    {
      id: 7,
      title: 'Hardware WebAuthn UV',
      desc: 'User Verification is required for high-risk and irreversible capabilities.',
    },
    {
      id: 8,
      title: 'Fail-Closed Defaults',
      desc: 'Unknown operations, expired challenges, or altered digests are rejected.',
    },
    {
      id: 9,
      title: 'Inactive Tools Cannot Execute',
      desc: 'Only ACTIVE tools may execute; retired tools fail closed.',
    },
    {
      id: 10,
      title: 'Immutable Audit Trail',
      desc: 'Audit events are append-only and survive tool deletion.',
    },
    {
      id: 11,
      title: 'No Arbitrary Code Execution',
      desc: 'No eval, new Function, shell execution, or generated scripts.',
    },
    {
      id: 12,
      title: 'Deny-by-Default Origin Policy',
      desc: 'Strict URL.origin semantics prevent cross-origin prefix attacks.',
    },
    {
      id: 13,
      title: 'QUARANTINE Content Boundary',
      desc: 'Untrusted external content carries immutable provenance.',
    },
    {
      id: 14,
      title: 'Retirement WebMCP Propagation',
      desc: 'Tool retirement immediately aborts in-flight signals and emits toolchange.',
    },
    {
      id: 15,
      title: 'Atomic Concurrency Guard',
      desc: 'Concurrent authorization consumers result in exactly one execution.',
    },
    {
      id: 16,
      title: 'WebMCP Fallback Grace',
      desc: 'Absence of host WebMCP does not crash the application.',
    },
    {
      id: 17,
      title: 'ActionRegistry Sole Target',
      desc: 'No second or parallel execution architecture exists.',
    },
    {
      id: 18,
      title: 'Deterministic Boundary',
      desc: 'No security decision depends solely on an LLM classifier.',
    },
  ];

  return (
    <div className="main-content">
      <div className="header">
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>
            Security Posture & Cryptographic Core
          </h2>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Production security boundaries: WebMCP, WebAuthn passkeys, QUARANTINE, and 18
            Invariants.
          </div>
        </div>
      </div>

      {/* Security Posture Dashboard */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="card">
          <div
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              color: '#64748b',
              fontWeight: 700,
              marginBottom: '4px',
            }}
          >
            WebMCP
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8' }}>CONNECTED</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
            Dynamic Tool Surface
          </div>
        </div>

        <div className="card">
          <div
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              color: '#64748b',
              fontWeight: 700,
              marginBottom: '4px',
            }}
          >
            WebAuthn
          </div>
          <div
            style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color: passkeys.length > 0 ? '#10b981' : '#f59e0b',
            }}
          >
            {passkeys.length > 0 ? `${passkeys.length} PASSKEY(S)` : 'NOT ENROLLED'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
            FIDO2 / WebAuthn UV
          </div>
        </div>

        <div className="card">
          <div
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              color: '#64748b',
              fontWeight: 700,
              marginBottom: '4px',
            }}
          >
            User Verification
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>REQUIRED</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
            High-Risk Actions
          </div>
        </div>

        <div className="card">
          <div
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              color: '#64748b',
              fontWeight: 700,
              marginBottom: '4px',
            }}
          >
            QUARANTINE
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>ACTIVE</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
            Provenance & Budgets
          </div>
        </div>

        <div className="card">
          <div
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              color: '#64748b',
              fontWeight: 700,
              marginBottom: '4px',
            }}
          >
            Origin Policy
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>
            DENY-BY-DEFAULT
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
            URL.origin Matching
          </div>
        </div>
      </div>

      {/* Passkey Management Section */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>WebAuthn Hardware Passkeys</h3>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              Enrolled authenticators used to cryptographically authorize high-risk and irreversible
              actions.
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={enrollPasskey}
            disabled={registering}
            style={{ gap: '8px' }}
          >
            <Plus size={16} />
            {registering ? 'Enrolling Passkey...' : 'Enroll Hardware Passkey'}
          </button>
        </div>

        {msg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '6px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.82rem',
              background:
                msg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: msg.type === 'success' ? '#10b981' : '#ef4444',
              border: `1px solid ${msg.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            }}
          >
            {msg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {msg.text}
          </div>
        )}

        {loadingPasskeys ? (
          <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Loading credentials...</div>
        ) : passkeys.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: '#94a3b8',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
            }}
          >
            <Key size={32} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: '0.85rem' }}>No hardware passkeys enrolled yet.</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              Enroll a Touch ID, Face ID, or security key to enable WebAuthn authorization.
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Credential ID</th>
                <th>Sign Counter</th>
                <th>Enrolled At</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {passkeys.map(c => (
                <tr key={c.id}>
                  <td>
                    <span className="mono" style={{ color: '#38bdf8', fontSize: '0.8rem' }}>
                      {c.credentialId.slice(0, 24)}...
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-secondary mono">{c.counter}</span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {new Date(c.createdAt).toLocaleDateString()}{' '}
                    {new Date(c.createdAt).toLocaleTimeString()}
                  </td>
                  <td>
                    {c.revokedAt ? (
                      <span className="badge badge-risk-critical">REVOKED</span>
                    ) : (
                      <span className="badge badge-active">ACTIVE</span>
                    )}
                  </td>
                  <td>
                    {!c.revokedAt && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => revokePasskey(c.credentialId)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          color: '#ef4444',
                          gap: '4px',
                        }}
                      >
                        <Trash2 size={12} /> Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 18 Security Invariants */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Shield size={20} color="#10b981" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>18 Security Invariants</h3>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '12px',
          }}
        >
          {invariants.map(inv => (
            <div
              key={inv.id}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  flexShrink: 0,
                }}
              >
                {inv.id}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#f8fafc' }}>
                  {inv.title}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                  {inv.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Argument Digest Test Bench */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Lock size={18} color="#38bdf8" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
            Invariant 4 & 5: Argument Digest Test Bench
          </h3>
        </div>
        <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '12px' }}>
          Modify any parameter below to observe how the SHA-256 argument digest instantly shifts,
          cryptographically breaking any forged or replayed human authorization.
        </p>

        <textarea
          style={{
            width: '100%',
            height: '90px',
            background: '#090d16',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '6px',
            color: '#38bdf8',
            fontFamily: 'monospace',
            fontSize: '0.82rem',
            padding: '10px',
            marginBottom: '12px',
          }}
          value={testArgs}
          onChange={e => setTestArgs(e.target.value)}
        />

        <button
          className="btn btn-primary"
          onClick={computeDigestLocal}
          style={{ marginBottom: '12px' }}
        >
          Calculate SHA-256 Digest
        </button>

        {digest && (
          <div
            style={{
              background: '#090d16',
              padding: '10px 14px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                color: '#64748b',
                fontWeight: 700,
              }}
            >
              Computed Canonical SHA-256 Digest
            </div>
            <div
              className="mono"
              style={{
                color: '#10b981',
                fontSize: '0.85rem',
                wordBreak: 'break-all',
                marginTop: '4px',
              }}
            >
              {digest}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
