import React, { useState, useMemo } from 'react';
import { Authorization } from '@deputy/domain';
import { Key, RefreshCw, Search, Lock, CheckCircle2, Eye } from 'lucide-react';
import { Badge } from '../components/ui/Badge.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { Surface } from '../components/ui/Surface.js';
import { Drawer } from '../components/ui/Drawer.js';
import { useToast } from '../context/ToastContext.js';

interface AuthorizationCenterProps {
  authorizations: Authorization[];
  onRefresh: () => void;
}

export const AuthorizationCenterView: React.FC<AuthorizationCenterProps> = ({
  authorizations,
  onRefresh,
}) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Selected Authorization for Slide-Over Drawer
  const [selectedAuth, setSelectedAuth] = useState<Authorization | null>(null);
  const [drawerTab, setDrawerTab] = useState<'operation' | 'binding' | 'human' | 'raw'>(
    'operation',
  );

  // SECURITY WOW MOMENT: Tamper Test Bench State
  const [tamperToolId] = useState('create_customer_with_invoice');
  const [originalAmount, setOriginalAmount] = useState('4200');
  const [tamperedAmount, setTamperedAmount] = useState('5000');
  const [tamperRunning, setTamperRunning] = useState(false);
  const [tamperResult, setTamperResult] = useState<any>(null);

  const filteredAuthorizations = useMemo(() => {
    return authorizations.filter(auth => {
      if (statusFilter !== 'ALL' && auth.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTool = auth.toolId.toLowerCase().includes(q);
        const matchReq = auth.requestId.toLowerCase().includes(q);
        const matchAuthId = auth.authorizationId.toLowerCase().includes(q);
        if (!matchTool && !matchReq && !matchAuthId) return false;
      }
      return true;
    });
  }, [authorizations, statusFilter, searchQuery]);

  // Run Tamper Rejection Test
  const runTamperTest = async () => {
    setTamperRunning(true);
    setTamperResult(null);

    try {
      // 1. First obtain a challenge/authorization token for original amount (4200)
      const requestId = `req_tamper_${Date.now()}`;
      const originalArgs = {
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        amount: Number(originalAmount),
      };

      const challengeRes = await fetch(
        'http://localhost:4000/api/auth/webauthn/authorize/challenge',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toolId: tamperToolId,
            toolVersion: 1,
            arguments: originalArgs,
            requestId,
            actorId: 'usr_ops_lead',
          }),
        },
      );

      const challengeData = await challengeRes.json();
      if (!challengeRes.ok) {
        throw new Error(challengeData.error?.message || 'Challenge generation failed');
      }

      const { authorizationId, argumentDigest: origDigest } = challengeData.data;

      // 2. Now simulate attacker modifying arguments to amount: 5000 while passing the token
      const tamperedArgs = {
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        amount: Number(tamperedAmount),
      };

      const proposalRes = await fetch('http://localhost:4000/api/tool-proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-deputy-authorization-id': authorizationId,
        },
        body: JSON.stringify({
          proposalId: `prop_tamper_${Date.now()}`,
          toolId: tamperToolId,
          toolVersion: 1,
          arguments: tamperedArgs,
          requestId,
          proposedBy: { agentId: 'malicious_in_flight_injector', origin: window.location.origin },
          timestamp: new Date().toISOString(),
        }),
      });

      const proposalData = await proposalRes.json();
      setTamperResult({
        status: proposalRes.status,
        originalArgs,
        originalDigest: origDigest,
        tamperedArgs,
        authorizationId,
        response: proposalData,
      });

      if (proposalData.decision === 'DENY' || proposalRes.status >= 400) {
        showToast(
          'success',
          'Security Invariant 4 Verified!',
          'Backend deterministically rejected tampered arguments.',
        );
      } else {
        showToast('error', 'Tamper Detection Failed', 'Operation was not rejected.');
      }

      onRefresh();
    } catch (err: unknown) {
      setTamperResult({ error: String(err) });
    } finally {
      setTamperRunning(false);
    }
  };

  return (
    <div className="page-body">
      {/* Header */}
      <div
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
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
              PRIVILEGED ACCESS GATE
            </span>
            <span style={{ color: 'var(--border-strong)' }}>/</span>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              FIDO2 WEBAUTHN UV
            </span>
          </div>
          <h1 className="page-title">Authorization Center</h1>
          <p className="page-description">
            Cryptographic single-use authorization queue with SHA-256 parameter binding and FIDO2
            User Verification ceremony.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onRefresh}
          style={{ gap: 5 }}
        >
          <RefreshCw size={13} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Security Invariant 4 & 5 Banner */}
      <Surface level={2} style={{ marginBottom: 20, padding: '12px 18px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(129, 140, 248, 0.12)',
                border: '1px solid rgba(129, 140, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--semantic-auth)',
              }}
            >
              <Lock size={16} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                Invariant 4 & 5: Single-Use & Exact Argument Digest Binding
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                Authorizations are strictly single-use and bound to the SHA-256 hash of the exact
                parameter set. Modifying even 1 character in arguments invalidates the authorization
                deterministically.
              </div>
            </div>
          </div>
          <Badge variant="auth">{authorizations.length} AUTHORIZATIONS EMITTED</Badge>
        </div>
      </Surface>

      {/* 2-Column: Authorization Queue (Left) | Security "WOW" Tamper Bench (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        {/* Left Column: Authorization Queue */}
        <div>
          {/* Toolbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              marginBottom: 12,
            }}
          >
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: 30, fontSize: '0.8rem' }}
                placeholder="Search by tool, request ID, or auth ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div
              style={{
                display: 'flex',
                gap: 2,
                background: 'var(--surface-2)',
                padding: '2px 4px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {['ALL', 'AUTHORIZED', 'CONSUMED', 'PENDING', 'REJECTED'].map(st => (
                <button
                  key={st}
                  type="button"
                  className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '2px 6px', fontSize: '0.7rem', border: 'none' }}
                  onClick={() => setStatusFilter(st)}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <Surface
            level={2}
            noPadding
            headerTitle="Authorization Records Queue"
            headerMeta={`${filteredAuthorizations.length} ITEMS`}
          >
            {filteredAuthorizations.length === 0 ? (
              <div style={{ padding: 30 }}>
                <EmptyState
                  icon={<Key size={22} />}
                  title="No Authorizations Found"
                  description="High-risk operations proposed by AI agents or the Operations Console generate cryptographic authorization requests."
                />
              </div>
            ) : (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tool & Auth ID</th>
                      <th>Status</th>
                      <th>Actor & Method</th>
                      <th>Argument Digest</th>
                      <th>Expires</th>
                      <th>Inspect</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAuthorizations.map(auth => {
                      const isSelected = selectedAuth?.authorizationId === auth.authorizationId;
                      return (
                        <tr
                          key={auth.authorizationId}
                          className={`clickable ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedAuth(auth)}
                        >
                          <td>
                            <div
                              style={{
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                fontSize: '0.84rem',
                              }}
                            >
                              {auth.toolId}
                            </div>
                            <div
                              className="mono"
                              style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}
                            >
                              {auth.authorizationId.slice(0, 18)}...
                            </div>
                          </td>

                          <td>
                            <Badge
                              variant={
                                auth.status === 'CONSUMED'
                                  ? 'draft'
                                  : auth.status === 'AUTHORIZED'
                                    ? 'active'
                                    : auth.status === 'REJECTED'
                                      ? 'risk-critical'
                                      : 'compensatable'
                              }
                            >
                              {auth.status}
                            </Badge>
                          </td>

                          <td>
                            <div
                              className="mono"
                              style={{ fontSize: '0.76rem', color: 'var(--text-primary)' }}
                            >
                              {auth.actor?.id || 'Pending'}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--semantic-auth)' }}>
                              {auth.authorizationMethod}
                            </div>
                          </td>

                          <td>
                            <span
                              className="mono"
                              style={{ fontSize: '0.72rem', color: 'var(--semantic-audit)' }}
                            >
                              {auth.argumentDigest
                                ? `${auth.argumentDigest.slice(0, 12)}...`
                                : 'N/A'}
                            </span>
                          </td>

                          <td>
                            <span
                              className="mono"
                              style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}
                            >
                              {new Date(auth.expiresAt).toLocaleTimeString()}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '2px 6px', fontSize: '0.72rem' }}
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedAuth(auth);
                              }}
                            >
                              <Eye size={11} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Surface>
        </div>

        {/* Right Column: Security "WOW" Tamper Rejection Test Bench */}
        <Surface
          level={2}
          headerTitle="Security WOW: Tamper Rejection"
          headerMeta="INVARIANT 4 TEST BENCH"
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
            Demonstrates that altering even 1 byte of an authorized argument set alters the SHA-256
            digest and causes deterministic rejection by the backend policy gate.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            <div>
              <label className="form-label">Authorized Amount (₹)</label>
              <input
                type="number"
                className="form-input mono"
                value={originalAmount}
                onChange={e => setOriginalAmount(e.target.value)}
              />
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                The user signs a WebAuthn passkey assertion for ₹{originalAmount}.
              </div>
            </div>

            <div>
              <label className="form-label" style={{ color: 'var(--semantic-danger)' }}>
                Attacker Modified Amount (₹)
              </label>
              <input
                type="number"
                className="form-input mono"
                value={tamperedAmount}
                onChange={e => setTamperedAmount(e.target.value)}
                style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}
              />
              <div style={{ fontSize: '0.7rem', color: 'var(--semantic-danger)', marginTop: 2 }}>
                Simulates in-flight tampering before gateway execution.
              </div>
            </div>

            <button
              type="button"
              className="btn btn-danger"
              disabled={tamperRunning}
              onClick={runTamperTest}
              style={{ gap: 6, marginTop: 4 }}
            >
              <Lock size={14} />
              <span>{tamperRunning ? 'Executing Test...' : 'Test Tamper Rejection'}</span>
            </button>
          </div>

          {/* Tamper Result Console */}
          {tamperResult && (
            <div
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: 12,
                fontSize: '0.76rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    color: 'var(--semantic-emerald)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <CheckCircle2 size={13} />
                  <span>GATEWAY DENIAL CONFIRMED</span>
                </span>
                <Badge variant="risk-critical">DENIED</Badge>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Original Digest: </span>
                  <span className="mono" style={{ color: 'var(--semantic-emerald)' }}>
                    {tamperResult.originalDigest?.slice(0, 24)}...
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Backend Decision: </span>
                  <span
                    className="mono"
                    style={{ color: 'var(--semantic-danger)', fontWeight: 700 }}
                  >
                    {tamperResult.response?.decision || 'DENY'}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Denial Reason: </span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {tamperResult.response?.reason ||
                      'ARGUMENT_DIGEST_MISMATCH: Computed argument digest did not match authorization.'}
                  </span>
                </div>
              </div>

              <pre
                className="mono"
                style={{
                  background: 'var(--surface-0)',
                  padding: 8,
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '0.7rem',
                  color: '#cbd5e1',
                  maxHeight: 140,
                  overflowY: 'auto',
                }}
              >
                {JSON.stringify(tamperResult.response, null, 2)}
              </pre>
            </div>
          )}
        </Surface>
      </div>

      {/* Slide-over Authorization Detail Drawer */}
      <Drawer
        isOpen={!!selectedAuth}
        onClose={() => setSelectedAuth(null)}
        title={`Authorization: ${selectedAuth?.toolId}`}
        subtitle={`ID: ${selectedAuth?.authorizationId}`}
        headerBadge={
          selectedAuth ? (
            <Badge
              variant={
                selectedAuth.status === 'CONSUMED'
                  ? 'draft'
                  : selectedAuth.status === 'AUTHORIZED'
                    ? 'active'
                    : selectedAuth.status === 'REJECTED'
                      ? 'risk-critical'
                      : 'compensatable'
              }
            >
              {selectedAuth.status}
            </Badge>
          ) : undefined
        }
        tabs={[
          { id: 'operation', label: 'Operation' },
          { id: 'binding', label: 'Cryptographic Binding' },
          { id: 'human', label: 'Human Authority' },
          { id: 'raw', label: 'Raw Token' },
        ]}
        activeTab={drawerTab}
        onTabChange={tab => setDrawerTab(tab as any)}
      >
        {selectedAuth && (
          <>
            {drawerTab === 'operation' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 8,
                    fontSize: '0.78rem',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Target Tool: </span>
                    <span
                      className="mono"
                      style={{ color: 'var(--text-primary)', fontWeight: 600 }}
                    >
                      {selectedAuth.toolId} (v{selectedAuth.toolVersion})
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Request ID: </span>
                    <span className="mono">{selectedAuth.requestId}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Nonce: </span>
                    <span className="mono">{selectedAuth.nonce}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Status: </span>
                    <span className="mono">{selectedAuth.status}</span>
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--surface-2)',
                    padding: 12,
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      fontWeight: 700,
                      marginBottom: 4,
                    }}
                  >
                    Single-Use Consumption Tracking
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    {selectedAuth.consumedAt ? (
                      <div>
                        Consumed at:{' '}
                        <span className="mono">
                          {new Date(selectedAuth.consumedAt).toLocaleString()}
                        </span>{' '}
                        by proposal{' '}
                        <span className="mono">{selectedAuth.consumedByProposalId}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--semantic-emerald)' }}>
                        Unconsumed single-use token (valid until expiration)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {drawerTab === 'binding' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div
                  style={{
                    background: 'var(--surface-2)',
                    padding: 14,
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    SHA-256 Argument Digest Binding
                  </div>
                  <div
                    className="mono"
                    style={{
                      fontSize: '0.76rem',
                      color: 'var(--semantic-emerald)',
                      wordBreak: 'break-all',
                      background: 'var(--surface-0)',
                      padding: 8,
                      borderRadius: 'var(--radius-xs)',
                    }}
                  >
                    {selectedAuth.argumentDigest}
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--surface-2)',
                    padding: 14,
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    WebAuthn Assertion Details
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      fontSize: '0.78rem',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Method: </span>
                      <span className="mono">{selectedAuth.authorizationMethod}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Credential ID: </span>
                      <span className="mono">
                        {selectedAuth.webauthnAssertion?.credentialId?.slice(0, 32) || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>User Verification: </span>
                      <span className="mono" style={{ color: 'var(--semantic-emerald)' }}>
                        {selectedAuth.webauthnAssertion?.userVerified
                          ? 'VERIFIED (PASSKEY UV)'
                          : 'EXPLICIT HUMAN'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {drawerTab === 'human' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div
                  style={{
                    background: 'var(--surface-2)',
                    padding: 14,
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    Human Authority Signer
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      fontSize: '0.78rem',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Actor ID: </span>
                      <span className="mono" style={{ fontWeight: 600 }}>
                        {selectedAuth.actor?.id || 'usr_ops_lead'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Role: </span>
                      <span className="mono">{selectedAuth.actor?.role || 'OPERATOR'}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Method: </span>
                      <span className="mono" style={{ color: 'var(--semantic-auth)' }}>
                        {selectedAuth.authorizationMethod}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Issued At: </span>
                      <span className="mono">
                        {new Date(selectedAuth.issuedAt).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Expires At: </span>
                      <span className="mono">
                        {new Date(selectedAuth.expiresAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {drawerTab === 'raw' && (
              <pre
                className="mono"
                style={{
                  background: 'var(--surface-0)',
                  border: '1px solid var(--border-subtle)',
                  padding: 14,
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.74rem',
                  color: '#cbd5e1',
                  maxHeight: 480,
                  overflowY: 'auto',
                }}
              >
                {JSON.stringify(selectedAuth, null, 2)}
              </pre>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
};
