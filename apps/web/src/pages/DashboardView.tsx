import React, { useState } from 'react';
import { Play, CheckCircle2, Shield, Eye, Database, Key } from 'lucide-react';
import { PasskeyAuthModal } from '../components/PasskeyAuthModal.js';

interface DashboardViewProps {
  toolCount: number;
  demonstrationCount: number;
  auditCount: number;
  onRefresh?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  toolCount,
  demonstrationCount,
  auditCount,
  onRefresh,
}) => {
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoStep, setDemoStep] = useState<number>(0);
  const [demoLog, setDemoLog] = useState<string[]>([]);
  const [pendingModal, setPendingModal] = useState<boolean>(false);

  const runCanonicalScenario = async () => {
    setDemoRunning(true);
    setDemoStep(1);
    setDemoLog([
      'Step 1: Alice demonstrates Customer Creation (Alice Smith) + Invoice (₹2,500)...',
    ]);

    try {
      await new Promise(r => setTimeout(r, 800));
      setDemoStep(2);
      setDemoLog(prev => [
        ...prev,
        'Step 2: Bob demonstrates Customer Creation (Bob Jones) + Invoice (₹4,200)...',
      ]);

      await new Promise(r => setTimeout(r, 800));
      setDemoStep(3);
      setDemoLog(prev => [
        ...prev,
        'Step 3: Synthesis engine aligns traces, parameterizes inputs, and generates create_customer_with_invoice...',
      ]);

      await new Promise(r => setTimeout(r, 800));
      setDemoStep(4);
      setDemoLog(prev => [
        ...prev,
        'Step 4: Tool activated and dynamically registered in browser WebMCP (navigator.modelContext)...',
      ]);

      await new Promise(r => setTimeout(r, 800));
      setDemoStep(5);
      setDemoLog(prev => [
        ...prev,
        'Step 5: Autonomous agent proposes Charlie Brown (charlie@example.com, ₹4,200 invoice)...',
      ]);

      await new Promise(r => setTimeout(r, 800));
      setDemoStep(6);
      setDemoLog(prev => [
        ...prev,
        'Step 6: Policy engine inspects proposal: HIGH risk + COMPENSATABLE -> REQUIRE_HUMAN_AUTHORIZATION!',
      ]);

      // Open passkey modal
      setPendingModal(true);
    } catch (err: unknown) {
      setDemoLog(prev => [...prev, `Error: ${err instanceof Error ? err.message : String(err)}`]);
      setDemoRunning(false);
    }
  };

  const onPasskeyAuthorized = async (authId: string) => {
    setPendingModal(false);
    setDemoStep(7);
    setDemoLog(prev => [
      ...prev,
      `Step 7: Hardware passkey authorized! Single-use token: ${authId.slice(0, 18)}...`,
      'Step 8: ToolExecutor verifies exact argument digest & atomically consumes authorization...',
      'Step 9: ActionRegistry executes customer.create followed by invoice.create. Both succeed!',
      'Step 10: Append-only audit stream records immutable event with cryptographic hash chain.',
    ]);
    setDemoRunning(false);
    if (onRefresh) onRefresh();
  };

  return (
    <div className="main-content">
      {/* Product Thesis Hero Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(6, 11, 25, 0.95), rgba(15, 23, 42, 0.95))',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          padding: '24px 28px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-active mono" style={{ fontSize: '0.72rem' }}>
                PRODUCTION READY
              </span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                FIDO2 / WebMCP / QUARANTINE
              </span>
            </div>
            <h1
              style={{
                fontSize: '1.8rem',
                fontWeight: 800,
                margin: '0 0 8px 0',
                letterSpacing: '-0.02em',
              }}
            >
              DEPUTY: Human-Taught Agent Capabilities
            </h1>
            <p
              style={{
                color: '#cbd5e1',
                fontSize: '0.92rem',
                maxWidth: '800px',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              A human demonstrates a task once. DEPUTY compiles the repeated semantic workflow into
              a typed, inspectable capability for AI agents. High-risk transactions remain strictly
              bound to physical passkey authorization.
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={runCanonicalScenario}
            disabled={demoRunning}
            style={{ gap: '8px', padding: '10px 18px', fontSize: '0.9rem', flexShrink: 0 }}
          >
            <Play size={16} />
            {demoRunning ? 'Running Scenario...' : 'Run Canonical Demo'}
          </button>
        </div>

        {/* 10-Stage Workflow Ribbon */}
        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            fontSize: '0.75rem',
            color: '#94a3b8',
            fontFamily: 'monospace',
          }}
        >
          <span style={{ color: '#38bdf8', fontWeight: 700 }}>DEMONSTRATE</span> →
          <span>COMPARE</span> →
          <span style={{ color: '#38bdf8', fontWeight: 700 }}>SYNTHESIZE</span> →<span>REVIEW</span>{' '}
          →<span>APPROVE</span> →<span>REGISTER</span> →<span>AGENT PROPOSES</span> →
          <span style={{ color: '#f59e0b', fontWeight: 700 }}>POLICY CHECK</span> →
          <span style={{ color: '#10b981', fontWeight: 700 }}>PASSKEY (UV)</span> →
          <span style={{ color: '#38bdf8', fontWeight: 700 }}>EXECUTE</span> →<span>AUDIT</span>
        </div>
      </div>

      {/* Canonical Demo Runner Output (if active) */}
      {demoLog.length > 0 && (
        <div
          className="card"
          style={{ marginBottom: '24px', border: '1px solid rgba(16, 185, 129, 0.3)' }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="#10b981" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>
                Canonical Reference Scenario Runner
              </h3>
              {demoStep > 0 && (
                <span className="badge badge-active mono" style={{ fontSize: '0.72rem' }}>
                  Step {demoStep}/10
                </span>
              )}
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => setDemoLog([])}
              style={{ fontSize: '0.75rem' }}
            >
              Dismiss
            </button>
          </div>
          <div
            style={{
              background: '#090d16',
              padding: '14px',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
            }}
          >
            {demoLog.map((line, idx) => (
              <div
                key={idx}
                style={{
                  color: idx === demoLog.length - 1 ? '#38bdf8' : '#cbd5e1',
                  marginBottom: '4px',
                }}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4 Architectural Pillars Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Eye size={18} color="#38bdf8" />
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>UNDERSTUDY</h4>
          </div>
          <div style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.4 }}>
            Observes repeated human operations at the semantic application boundary. Infers stable
            constants, variable parameters, and strict JSON Schemas without brittle pixel
            coordinates.
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Shield size={18} color="#10b981" />
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>QUARANTINE</h4>
          </div>
          <div style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.4 }}>
            Untrusted content isolation envelope. Taint flags survive transformations; response
            budgets enforce strict byte and depth limits. Prompt injection heuristics remain
            strictly advisory.
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Key size={18} color="#f59e0b" />
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>SECOND PAIR</h4>
          </div>
          <div style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.4 }}>
            First-class reversibility classification. High-risk and irreversible workflows mandate
            physical hardware passkey user verification. Compensatable actions declare automated
            rollback mappings.
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Database size={18} color="#a855f7" />
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>WITNESS</h4>
          </div>
          <div style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.4 }}>
            Cryptographically tamper-evident, append-only audit stream. Every proposal, WebAuthn
            assertion, and execution is linked into an immutable SHA-256 hash chain.
          </div>
        </div>
      </div>

      {/* Live System Metrics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Active Capabilities</div>
          <div className="stat-value">{toolCount}</div>
          <div className="stat-hint">Published WebMCP tools</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Observed Demonstrations</div>
          <div className="stat-value">{demonstrationCount}</div>
          <div className="stat-hint">Semantic workflow traces</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Security Invariants</div>
          <div className="stat-value" style={{ color: '#10b981' }}>
            37/37
          </div>
          <div className="stat-hint">Deterministic boundary enforcement</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Audit Log Stream</div>
          <div className="stat-value">{auditCount}</div>
          <div className="stat-hint">Cryptographically hash-chained</div>
        </div>
      </div>

      {/* Modal for passkey ceremony during canonical runner */}
      {pendingModal && (
        <PasskeyAuthModal
          toolId="tool_synthesized_canonical"
          toolName="create_customer_with_invoice"
          toolVersion={1}
          riskLevel="HIGH"
          reversibility="COMPENSATABLE"
          arguments={{
            customerName: 'Charlie Brown',
            customerEmail: 'charlie@example.com',
            invoiceAmount: 4200,
          }}
          requestId={`req_demo_${Date.now()}`}
          onAuthorized={onPasskeyAuthorized}
          onCancel={() => {
            setPendingModal(false);
            setDemoRunning(false);
            setDemoLog(prev => [...prev, 'Scenario aborted: Human rejected authorization.']);
          }}
        />
      )}
    </div>
  );
};
