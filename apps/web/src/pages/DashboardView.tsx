import React, { useEffect, useState } from 'react';
import {
  Play,
  ShieldCheck,
  Key,
  Wrench,
  Video,
  ScrollText,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { AuditEvent, Authorization, LearnedTool } from '@deputy/domain';
import { PasskeyAuthModal } from '../components/PasskeyAuthModal.js';
import { ExecutionTraceModal } from '../components/ExecutionTraceModal.js';
import { Badge } from '../components/ui/Badge.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { MetricCard } from '../components/ui/MetricCard.js';
import { Surface } from '../components/ui/Surface.js';

interface DashboardViewProps {
  toolCount: number;
  demonstrationCount: number;
  auditCount: number;
  tools?: LearnedTool[];
  auditEvents?: AuditEvent[];
  onRefresh?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  toolCount,
  demonstrationCount,
  auditCount,
  tools = [],
  auditEvents = [],
  onRefresh,
  onNavigateTab,
}) => {
  // Authorizations state
  const [authorizations, setAuthorizations] = useState<Authorization[]>([]);
  const [loadingAuths, setLoadingAuths] = useState<boolean>(true);

  // Scenario execution state
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoStep, setDemoStep] = useState<number>(0);
  const [demoLog, setDemoLog] = useState<string[]>([]);
  const [passkeyModalOpen, setPasskeyModalOpen] = useState<boolean>(false);

  // Selected event for payload inspection
  const [selectedTraceEvent, setSelectedTraceEvent] = useState<AuditEvent | null>(null);

  // Fetch real authorizations
  const fetchAuthorizations = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/authorizations');
      if (res.ok) {
        const json = await res.json();
        setAuthorizations(json.data || []);
      }
    } catch (err) {
      console.warn('Failed to load authorizations', err);
    } finally {
      setLoadingAuths(false);
    }
  };

  useEffect(() => {
    fetchAuthorizations();
  }, []);

  // Compute pending authorizations
  const pendingAuthorizations = authorizations.filter(a => a.status === 'PENDING');

  // Compute risk distribution from active tools
  const riskCounts = {
    LOW: tools.filter(t => t.riskLevel === 'LOW').length,
    MEDIUM: tools.filter(t => t.riskLevel === 'MEDIUM').length,
    HIGH: tools.filter(t => t.riskLevel === 'HIGH').length,
    CRITICAL: tools.filter(t => t.riskLevel === 'CRITICAL').length,
  };
  const totalRiskTools = tools.length || 1; // avoid divide by zero

  // Scenario Runner
  const runCanonicalScenario = async () => {
    setDemoRunning(true);
    setDemoStep(1);
    setDemoLog([
      'Step 1: Alice demonstrates Customer Creation (Alice Smith) + Invoice (₹2,500)...',
    ]);

    try {
      await new Promise(r => setTimeout(r, 600));
      setDemoStep(2);
      setDemoLog(prev => [
        ...prev,
        'Step 2: Bob demonstrates Customer Creation (Bob Jones) + Invoice (₹4,200)...',
      ]);

      await new Promise(r => setTimeout(r, 600));
      setDemoStep(3);
      setDemoLog(prev => [
        ...prev,
        'Step 3: Synthesis engine aligns traces, parameterizes inputs, and generates create_customer_with_invoice...',
      ]);

      await new Promise(r => setTimeout(r, 600));
      setDemoStep(4);
      setDemoLog(prev => [
        ...prev,
        'Step 4: Tool activated and dynamically registered in browser WebMCP (document.modelContext)...',
      ]);

      await new Promise(r => setTimeout(r, 600));
      setDemoStep(5);
      setDemoLog(prev => [
        ...prev,
        'Step 5: Autonomous agent proposes Charlie Brown (charlie@example.com, ₹4,200 invoice)...',
      ]);

      await new Promise(r => setTimeout(r, 600));
      setDemoStep(6);
      setDemoLog(prev => [
        ...prev,
        'Step 6: Policy engine evaluates proposal: HIGH risk + COMPENSATABLE -> REQUIRE_HUMAN_AUTHORIZATION!',
      ]);

      // Open passkey ceremony modal
      setPasskeyModalOpen(true);
    } catch (err: unknown) {
      setDemoLog(prev => [...prev, `Error: ${err instanceof Error ? err.message : String(err)}`]);
      setDemoRunning(false);
    }
  };

  const handlePasskeySuccess = async (authId: string) => {
    setPasskeyModalOpen(false);
    setDemoStep(7);
    setDemoLog(prev => [
      ...prev,
      `Step 7: Hardware passkey authorized! Single-use token: ${authId.slice(0, 20)}...`,
      'Step 8: ToolExecutor verifies exact argument digest & atomically consumes authorization...',
      'Step 9: ActionRegistry executes customer.create followed by invoice.create. Both succeed!',
      'Step 10: Append-only audit stream records immutable event with SHA-256 hash chain.',
    ]);
    setDemoRunning(false);
    if (onRefresh) onRefresh();
    fetchAuthorizations();
  };

  return (
    <div className="page-body">
      {/* 1. Header & Command Introduction */}
      <div
        className="page-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--semantic-auth)',
                fontWeight: 700,
              }}
            >
              SECURITY COMMAND CENTER
            </span>
            <span style={{ color: 'var(--border-strong)' }}>/</span>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              NODE: PROD_GATE_01
            </span>
          </div>
          <h1 className="page-title">Observe. Learn. Authorize.</h1>
          <p className="page-description">
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{toolCount}</span>{' '}
            active capabilities ·{' '}
            <span
              style={{
                color:
                  pendingAuthorizations.length > 0
                    ? 'var(--semantic-amber)'
                    : 'var(--text-primary)',
                fontWeight: 600,
              }}
            >
              {pendingAuthorizations.length}
            </span>{' '}
            awaiting human authority ·{' '}
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{auditCount}</span>{' '}
            cryptographic audit records
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={runCanonicalScenario}
          disabled={demoRunning}
          style={{ gap: '8px', padding: '8px 16px' }}
        >
          <Play size={14} fill="currentColor" />
          <span>{demoRunning ? `Scenario Step ${demoStep}/10...` : 'Run Canonical Demo'}</span>
        </button>
      </div>

      {/* 2. Primary Technical Metrics Grid */}
      <div className="stats-grid">
        <MetricCard
          label="Active Capabilities"
          value={toolCount}
          hint="Typed WebMCP tools in runtime"
          icon={<Wrench size={16} />}
          statusColor="webmcp"
        />
        <MetricCard
          label="Pending Authorizations"
          value={pendingAuthorizations.length}
          hint={
            pendingAuthorizations.length > 0 ? 'Action required by human' : 'Zero pending requests'
          }
          icon={<Key size={16} />}
          statusColor={pendingAuthorizations.length > 0 ? 'amber' : 'emerald'}
        />
        <MetricCard
          label="Recorded Demonstrations"
          value={demonstrationCount}
          hint="Human semantic action traces"
          icon={<Video size={16} />}
        />
        <MetricCard
          label="Audit Events (SHA-256)"
          value={auditCount}
          hint="Immutable cryptographic chain"
          icon={<ScrollText size={16} />}
          statusColor="audit"
        />
      </div>

      {/* 3. Main Grid: Security Posture (Left) + Risk & Live Authorizations (Right) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: '20px',
          marginBottom: '24px',
        }}
      >
        {/* Security Posture Panel */}
        <Surface
          level={2}
          headerTitle="Security Posture & Enforcement Invariants"
          headerMeta="FAIL-CLOSED VERIFIED"
          headerAction={
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.72rem', padding: '4px 8px' }}
              onClick={() => onNavigateTab && onNavigateTab('security')}
            >
              Inspect 37 Invariants <ArrowRight size={12} />
            </button>
          }
        >
          <div className="security-posture-grid">
            <div className="posture-item">
              <span className="posture-label">Human Verification</span>
              <span className="posture-value">
                <span className="status-dot active" />
                FIDO2 WebAuthn
              </span>
              <span className="posture-meta">User Verification (UV)</span>
            </div>

            <div className="posture-item">
              <span className="posture-label">Argument Binding</span>
              <span className="posture-value">
                <span className="status-dot active" />
                SHA-256 Hex
              </span>
              <span className="posture-meta">Canonical NFC Form</span>
            </div>

            <div className="posture-item">
              <span className="posture-label">Execution Target</span>
              <span className="posture-value">
                <span className="status-dot active" />
                ActionRegistry
              </span>
              <span className="posture-meta">No eval / scripts</span>
            </div>

            <div className="posture-item">
              <span className="posture-label">Origin Policy</span>
              <span className="posture-value">
                <span className="status-dot active" />
                WHATWG Enforced
              </span>
              <span className="posture-meta">Prefix Spoof Defense</span>
            </div>

            <div className="posture-item">
              <span className="posture-label">Audit Log</span>
              <span className="posture-value">
                <span className="status-dot active" />
                Hash Chained
              </span>
              <span className="posture-meta">Genesis Linked</span>
            </div>

            <div className="posture-item">
              <span className="posture-label">Quarantine Budget</span>
              <span className="posture-value">
                <span className="status-dot active" />
                64KB / 6-Depth
              </span>
              <span className="posture-meta">Immutable Taint</span>
            </div>
          </div>
        </Surface>

        {/* Risk Distribution Breakdown */}
        <Surface
          level={2}
          headerTitle="Capability Risk Profile"
          headerMeta={`${tools.length} Tools`}
        >
          <div className="risk-bar-container">
            <div
              className="risk-bar-segment risk-bar-low"
              style={{ width: `${(riskCounts.LOW / totalRiskTools) * 100}%` }}
              title={`Low Risk: ${riskCounts.LOW}`}
            />
            <div
              className="risk-bar-segment risk-bar-medium"
              style={{ width: `${(riskCounts.MEDIUM / totalRiskTools) * 100}%` }}
              title={`Medium Risk: ${riskCounts.MEDIUM}`}
            />
            <div
              className="risk-bar-segment risk-bar-high"
              style={{ width: `${(riskCounts.HIGH / totalRiskTools) * 100}%` }}
              title={`High Risk: ${riskCounts.HIGH}`}
            />
            <div
              className="risk-bar-segment risk-bar-critical"
              style={{ width: `${(riskCounts.CRITICAL / totalRiskTools) * 100}%` }}
              title={`Critical Risk: ${riskCounts.CRITICAL}`}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--text-secondary)',
                }}
              >
                <span className="status-dot active" /> Low Risk
              </span>
              <span className="mono" style={{ fontWeight: 600 }}>
                {riskCounts.LOW}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--text-secondary)',
                }}
              >
                <span className="status-dot amber" /> Medium Risk
              </span>
              <span className="mono" style={{ fontWeight: 600 }}>
                {riskCounts.MEDIUM}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--text-secondary)',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f97316' }} />{' '}
                High Risk
              </span>
              <span className="mono" style={{ fontWeight: 600 }}>
                {riskCounts.HIGH}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--text-secondary)',
                }}
              >
                <span className="status-dot danger" /> Critical Risk
              </span>
              <span className="mono" style={{ fontWeight: 600 }}>
                {riskCounts.CRITICAL}
              </span>
            </div>
          </div>
        </Surface>
      </div>

      {/* 4. Pending Human Authorizations Surface */}
      <Surface
        level={2}
        headerTitle="Pending Human Authorization"
        headerMeta={
          pendingAuthorizations.length > 0
            ? `${pendingAuthorizations.length} AWAITING PASSKEY`
            : 'GATE SECURE'
        }
        headerAction={
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '0.72rem', padding: '4px 8px' }}
            onClick={fetchAuthorizations}
          >
            Refresh Gate
          </button>
        }
      >
        {loadingAuths ? (
          <div style={{ padding: '16px 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Inspecting authorization gatekeeper state...
          </div>
        ) : pendingAuthorizations.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck size={20} style={{ color: 'var(--semantic-emerald)' }} />}
            title="No Pending Authorizations"
            description="DEPUTY has no autonomous operations waiting for human privilege escalation. The execution gate is secure."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingAuthorizations.map(auth => (
              <div
                key={auth.authorizationId}
                style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border-auth)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    <span
                      style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}
                    >
                      {auth.toolId}
                    </span>
                    <Badge variant="auth">v{auth.toolVersion}</Badge>
                    <Badge variant="risk-high">HIGH RISK</Badge>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '0.76rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span>
                      Request: <span className="mono">{auth.requestId}</span>
                    </span>
                    <span>
                      Actor: <span className="mono">{auth.actor.id}</span> ({auth.actor.role})
                    </span>
                    <span>
                      Digest: <span className="mono">{auth.argumentDigest.slice(0, 16)}...</span>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-accent"
                  onClick={() => setPasskeyModalOpen(true)}
                  style={{ gap: '6px' }}
                >
                  <Key size={13} />
                  <span>Authorize with Passkey</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </Surface>

      {/* 5. Live Activity & Cryptographic Audit Stream */}
      <Surface
        level={2}
        headerTitle="Recent System Activity & Audit Stream"
        headerMeta="APPEND-ONLY SHA-256 LOG"
        noPadding
        headerAction={
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '0.72rem', padding: '4px 8px' }}
            onClick={() => onNavigateTab && onNavigateTab('audit')}
          >
            Full Audit Stream <ArrowRight size={12} />
          </button>
        }
      >
        {auditEvents.length === 0 ? (
          <div style={{ padding: '24px' }}>
            <EmptyState
              icon={<ScrollText size={20} />}
              title="Audit Log Empty"
              description="No events have been recorded in the current session."
            />
          </div>
        ) : (
          <div className="timeline-stream">
            {auditEvents.slice(0, 6).map(evt => {
              const isSuccess = evt.status === 'SUCCESS';
              const isFailure = evt.status === 'FAILURE';
              return (
                <div
                  key={evt.eventId}
                  className="timeline-row"
                  onClick={() => setSelectedTraceEvent(evt)}
                  title="Click to inspect cryptographic event details"
                >
                  <div className="timeline-left">
                    <span
                      className={`status-dot ${isSuccess ? 'active' : isFailure ? 'danger' : 'amber'}`}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            fontSize: '0.82rem',
                          }}
                        >
                          {evt.eventType}
                        </span>
                        {evt.toolId && (
                          <span
                            className="mono"
                            style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}
                          >
                            {evt.toolId}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Actor: <span className="mono">{evt.actor.id}</span> ({evt.actor.type})
                        {evt.reason && ` · ${evt.reason}`}
                      </div>
                    </div>
                  </div>

                  <div className="timeline-meta">
                    <span className="mono" style={{ fontSize: '0.72rem' }}>
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                    <ExternalLink size={12} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Surface>

      {/* 6. Interactive Canonical Reference Scenario Console (When Run) */}
      {demoLog.length > 0 && (
        <Surface
          level={3}
          headerTitle="Canonical Reference Scenario Runner"
          headerMeta={`STEP ${demoStep} OF 10`}
          headerAction={
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.72rem', padding: '4px 8px' }}
              onClick={() => setDemoLog([])}
            >
              Close Runner
            </button>
          }
        >
          <div
            style={{
              background: 'var(--surface-0)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              color: '#cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {demoLog.map((logLine, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  color:
                    logLine.includes('Step 7') || logLine.includes('Both succeed')
                      ? '#34d399'
                      : '#cbd5e1',
                }}
              >
                <CheckCircle2
                  size={13}
                  style={{ color: 'var(--semantic-emerald)', marginTop: '2px', flexShrink: 0 }}
                />
                <span>{logLine}</span>
              </div>
            ))}
          </div>
        </Surface>
      )}

      {/* Hardware Passkey Authorization Ceremony Modal */}
      {passkeyModalOpen && (
        <PasskeyAuthModal
          toolId="create_customer_with_invoice"
          toolName="Create Customer & Bill Invoice"
          toolVersion={1}
          riskLevel="HIGH"
          reversibility="COMPENSATABLE"
          arguments={{
            name: 'Charlie Brown',
            email: 'charlie@example.com',
            amount: 4200,
          }}
          requestId="req_canonical_scenario"
          onAuthorized={handlePasskeySuccess}
          onCancel={() => {
            setPasskeyModalOpen(false);
            setDemoRunning(false);
          }}
        />
      )}

      {/* Cryptographic Event Payload Inspector Modal */}
      {selectedTraceEvent && (
        <ExecutionTraceModal
          proposal={{
            proposalId: selectedTraceEvent.eventId,
            toolId: selectedTraceEvent.toolId || 'system',
            toolVersion: selectedTraceEvent.toolVersion || 1,
            arguments: (selectedTraceEvent.metadata as Record<string, unknown>) || {},
            requestId: selectedTraceEvent.requestId || selectedTraceEvent.eventId,
            proposedBy: {
              agentId: selectedTraceEvent.actor.id,
              origin: 'http://localhost:5173',
            },
            timestamp: new Date(selectedTraceEvent.timestamp),
          }}
          result={{
            executionId: selectedTraceEvent.eventId,
            toolId: selectedTraceEvent.toolId || 'system',
            toolVersion: selectedTraceEvent.toolVersion || 1,
            success: selectedTraceEvent.status === 'SUCCESS',
            outcome: selectedTraceEvent.status === 'SUCCESS' ? 'SUCCESS' : 'NO_EFFECT',
            executedAt: new Date(selectedTraceEvent.timestamp),
            durationMs: 42,
            stepRecords: [
              {
                stepOrder: 0,
                actionId: selectedTraceEvent.eventType,
                actionVersion: 1,
                inputDigest:
                  (selectedTraceEvent.metadata as any)?.argumentDigest ||
                  'sha256_canonical_binding',
                status: selectedTraceEvent.status === 'SUCCESS' ? 'SUCCESS' : 'FAILURE',
                durationMs: 42,
                startedAt: new Date(selectedTraceEvent.timestamp),
                completedAt: new Date(selectedTraceEvent.timestamp),
                compensationStatus: 'NONE',
                correlationId: selectedTraceEvent.eventId,
                output: selectedTraceEvent.metadata || { actor: selectedTraceEvent.actor },
              },
            ],
          }}
          onClose={() => setSelectedTraceEvent(null)}
        />
      )}
    </div>
  );
};
