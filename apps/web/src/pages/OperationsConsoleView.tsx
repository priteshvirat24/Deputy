import React, { useState } from 'react';
import {
  UserPlus,
  FileText,
  RotateCcw,
  Calendar,
  Check,
  AlertCircle,
  Play,
  Bot,
  Key,
} from 'lucide-react';
import { ActiveRecordingState } from '../components/RecordingBar.js';
import { PasskeyAuthModal } from '../components/PasskeyAuthModal.js';
import { Badge } from '../components/ui/Badge.js';
import { Surface } from '../components/ui/Surface.js';

interface OperationsConsoleProps {
  recording: ActiveRecordingState | null;
  onActionObserved?: (actionType: string, summary: string) => void;
}

export const OperationsConsoleView: React.FC<OperationsConsoleProps> = ({
  recording,
  onActionObserved,
}) => {
  const [activeForm, setActiveForm] = useState<
    'create_customer' | 'create_invoice' | 'issue_refund' | 'schedule_followup'
  >('create_customer');
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<{
    actionId: string;
    summary: string;
    result: unknown;
    recorded: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [custName, setCustName] = useState('Alice Smith');
  const [custEmail, setCustEmail] = useState('alice@example.com');
  const [custCurrency, setCustCurrency] = useState('INR');

  const [invCustomerId, setInvCustomerId] = useState('cust_alice_smith');
  const [invAmount, setInvAmount] = useState('2500');
  const [invCurrency] = useState('INR');

  const [refCustomerId, setRefCustomerId] = useState('cust_alice_smith');
  const [refAmount, setRefAmount] = useState('500');
  const [refReason, setRefReason] = useState('Damaged item');

  const [fupCustomerId, setFupCustomerId] = useState('cust_alice_smith');
  const [fupDate, setFupDate] = useState('2026-09-10');
  const [fupNotes, setFupNotes] = useState('Review account satisfaction');

  // Agent Proposal Simulation state
  const [simulatingAgent, setSimulatingAgent] = useState(false);
  const [agentProposalResponse, setAgentProposalResponse] = useState<any>(null);
  const [passkeyRequirement, setPasskeyRequirement] = useState<{
    toolId: string;
    toolName: string;
    toolVersion: number;
    riskLevel: string;
    reversibility: string;
    arguments: Record<string, unknown>;
    requestId: string;
  } | null>(null);

  // Quick Preset Handlers for Demonstrations
  const applyPreset = (name: string, email: string, amount: string) => {
    setCustName(name);
    setCustEmail(email);
    const generatedId = `cust_${name.toLowerCase().replace(/\s+/g, '_')}`;
    setInvCustomerId(generatedId);
    setInvAmount(amount);
  };

  const executeAction = async (
    actionId: string,
    args: Record<string, unknown>,
    summary: string,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:4000/api/demonstrations/execute-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionId,
          actionVersion: 1,
          arguments: args,
          recordingDemonstrationId: recording?.demonstrationId,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Operation failed');
      }

      setLastResponse({
        actionId,
        summary,
        result: json.data.result,
        recorded: !!json.data.recordedAction,
      });

      if (recording && onActionObserved) {
        onActionObserved(actionId, summary);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // Simulate Autonomous Agent Proposal
  const simulateAgentProposal = async (toolId: string, args: Record<string, unknown>) => {
    setSimulatingAgent(true);
    setAgentProposalResponse(null);
    try {
      const requestId = `req_agent_${Date.now()}`;
      const res = await fetch('http://localhost:4000/api/tool-proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: `prop_${Date.now()}`,
          toolId,
          toolVersion: 1,
          arguments: args,
          requestId,
          proposedBy: {
            agentId: 'autonomous_sales_agent_01',
            origin: window.location.origin,
          },
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      setAgentProposalResponse(data);

      if (data.decision === 'REQUIRE_HUMAN_AUTHORIZATION') {
        setPasskeyRequirement({
          toolId,
          toolName: toolId.replace(/_/g, ' ').toUpperCase(),
          toolVersion: 1,
          riskLevel: data.requirement?.riskLevel || 'HIGH',
          reversibility: data.requirement?.reversibility || 'COMPENSATABLE',
          arguments: args,
          requestId,
        });
      }
    } catch (err: unknown) {
      setAgentProposalResponse({
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSimulatingAgent(false);
    }
  };

  const handlePasskeyAuthorized = async (authId: string) => {
    if (!passkeyRequirement) return;
    try {
      const res = await fetch('http://localhost:4000/api/tool-proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-deputy-authorization-id': authId,
        },
        body: JSON.stringify({
          proposalId: `prop_auth_${Date.now()}`,
          toolId: passkeyRequirement.toolId,
          toolVersion: passkeyRequirement.toolVersion,
          arguments: passkeyRequirement.arguments,
          requestId: passkeyRequirement.requestId,
          proposedBy: {
            agentId: 'autonomous_sales_agent_01',
            origin: window.location.origin,
          },
          timestamp: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      setAgentProposalResponse(data);
      setPasskeyRequirement(null);
    } catch (err: unknown) {
      setAgentProposalResponse({ error: String(err) });
    }
  };

  return (
    <div className="page-body">
      {/* Header */}
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
                color: 'var(--semantic-webmcp)',
                fontWeight: 700,
              }}
            >
              ENTERPRISE DOMAIN
            </span>
            <span style={{ color: 'var(--border-strong)' }}>/</span>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              ACTION REGISTRY
            </span>
          </div>
          <h1 className="page-title">Operations Console</h1>
          <p className="page-description">
            Execute trusted domain actions. When recording is active, actions are captured as
            semantic demonstration evidence.
          </p>
        </div>

        {recording && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--semantic-recording)',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--semantic-recording)',
                boxShadow: '0 0 8px var(--semantic-recording)',
              }}
            />
            Recording Active ({recording.actionCount} actions captured)
          </div>
        )}
      </div>

      {/* Demonstration Presets Bar */}
      <Surface level={2} style={{ marginBottom: '20px', padding: '12px 16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
              DEMONSTRATION PRESETS:
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              onClick={() => applyPreset('Alice Smith', 'alice@example.com', '2500')}
            >
              Alice Smith (₹2,500)
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              onClick={() => applyPreset('Bob Jones', 'bob@example.com', '4200')}
            >
              Bob Jones (₹4,200)
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              onClick={() => applyPreset('Charlie Brown', 'charlie@example.com', '4200')}
            >
              Charlie Brown (₹4,200)
            </button>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Fill common values to quickly record multi-trace demonstrations
          </span>
        </div>
      </Surface>

      {/* Main Grid: Left Nav + Middle Forms + Right Agent Proposal Simulator */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 1fr', gap: '20px' }}>
        {/* Left Operation Nav */}
        <Surface level={2} headerTitle="Trusted Actions" style={{ height: 'fit-content' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              type="button"
              className={`btn ${activeForm === 'create_customer' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', gap: '10px', width: '100%' }}
              onClick={() => setActiveForm('create_customer')}
            >
              <UserPlus size={15} /> Create Customer
            </button>
            <button
              type="button"
              className={`btn ${activeForm === 'create_invoice' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', gap: '10px', width: '100%' }}
              onClick={() => setActiveForm('create_invoice')}
            >
              <FileText size={15} /> Create Invoice
            </button>
            <button
              type="button"
              className={`btn ${activeForm === 'issue_refund' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', gap: '10px', width: '100%' }}
              onClick={() => setActiveForm('issue_refund')}
            >
              <RotateCcw size={15} /> Issue Refund
            </button>
            <button
              type="button"
              className={`btn ${activeForm === 'schedule_followup' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', gap: '10px', width: '100%' }}
              onClick={() => setActiveForm('schedule_followup')}
            >
              <Calendar size={15} /> Schedule Follow-up
            </button>
          </div>
        </Surface>

        {/* Middle Form & Execution Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Surface level={2} headerTitle={activeForm.replace(/_/g, ' ').toUpperCase()}>
            {activeForm === 'create_customer' && (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  executeAction(
                    'customer.create',
                    { name: custName, email: custEmail, currency: custCurrency },
                    custName,
                  );
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={custName}
                      onChange={e => setCustName(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'var(--surface-1)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.84rem',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={custEmail}
                      onChange={e => setCustEmail(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'var(--surface-1)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.84rem',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Currency
                    </label>
                    <select
                      value={custCurrency}
                      onChange={e => setCustCurrency(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'var(--surface-1)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        fontSize: '0.84rem',
                      }}
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ marginTop: '8px' }}
                  >
                    <Play size={13} />
                    <span>{loading ? 'Executing Action...' : 'Execute customer.create'}</span>
                  </button>
                </div>
              </form>
            )}

            {activeForm === 'create_invoice' && (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  executeAction(
                    'invoice.create',
                    {
                      customerId: invCustomerId,
                      amount: Number(invAmount),
                      currency: invCurrency,
                    },
                    `${invAmount} ${invCurrency}`,
                  );
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Customer ID
                    </label>
                    <input
                      type="text"
                      value={invCustomerId}
                      onChange={e => setInvCustomerId(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'var(--surface-1)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.84rem',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Invoice Amount
                    </label>
                    <input
                      type="number"
                      value={invAmount}
                      onChange={e => setInvAmount(e.target.value)}
                      min="1"
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'var(--surface-1)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.84rem',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ marginTop: '8px' }}
                  >
                    <Play size={13} />
                    <span>{loading ? 'Executing Action...' : 'Execute invoice.create'}</span>
                  </button>
                </div>
              </form>
            )}

            {activeForm === 'issue_refund' && (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  executeAction(
                    'refund.create',
                    { customerId: refCustomerId, amount: Number(refAmount), reason: refReason },
                    `${refAmount} INR`,
                  );
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Customer ID
                    </label>
                    <input
                      type="text"
                      value={refCustomerId}
                      onChange={e => setRefCustomerId(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'var(--surface-1)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.84rem',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Refund Amount
                    </label>
                    <input
                      type="number"
                      value={refAmount}
                      onChange={e => setRefAmount(e.target.value)}
                      min="1"
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'var(--surface-1)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.84rem',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Reason
                    </label>
                    <input
                      type="text"
                      value={refReason}
                      onChange={e => setRefReason(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'var(--surface-1)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        fontSize: '0.84rem',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-danger"
                    disabled={loading}
                    style={{ marginTop: '8px' }}
                  >
                    <Play size={13} />
                    <span>
                      {loading ? 'Executing Action...' : 'Execute refund.create (HIGH RISK)'}
                    </span>
                  </button>
                </div>
              </form>
            )}

            {activeForm === 'schedule_followup' && (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  executeAction(
                    'followup.schedule',
                    { customerId: fupCustomerId, date: fupDate, notes: fupNotes },
                    fupDate,
                  );
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Customer ID
                    </label>
                    <input
                      type="text"
                      value={fupCustomerId}
                      onChange={e => setFupCustomerId(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'var(--surface-1)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.84rem',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Scheduled Date
                    </label>
                    <input
                      type="date"
                      value={fupDate}
                      onChange={e => setFupDate(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'var(--surface-1)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        fontSize: '0.84rem',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Notes
                    </label>
                    <input
                      type="text"
                      value={fupNotes}
                      onChange={e => setFupNotes(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'var(--surface-1)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        fontSize: '0.84rem',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ marginTop: '8px' }}
                  >
                    <Play size={13} />
                    <span>{loading ? 'Executing Action...' : 'Execute followup.schedule'}</span>
                  </button>
                </div>
              </form>
            )}
          </Surface>

          {/* Execution Result Surface */}
          {error && (
            <Surface
              level={2}
              style={{
                borderColor: 'rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.05)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--semantic-danger)',
                  fontSize: '0.84rem',
                }}
              >
                <AlertCircle size={16} />
                <span style={{ fontWeight: 600 }}>Execution Failed: {error}</span>
              </div>
            </Surface>
          )}

          {lastResponse && (
            <Surface level={2} headerTitle="Execution Output" headerMeta={lastResponse.actionId}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.8rem',
                    color: 'var(--semantic-emerald)',
                  }}
                >
                  <Check size={14} />
                  <span>Success: {lastResponse.summary}</span>
                </div>
                {lastResponse.recorded && <Badge variant="active">Captured in Trace</Badge>}
              </div>
              <pre
                className="mono"
                style={{
                  background: 'var(--surface-0)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  fontSize: '0.76rem',
                  color: '#cbd5e1',
                  overflowX: 'auto',
                }}
              >
                {JSON.stringify(lastResponse.result, null, 2)}
              </pre>
            </Surface>
          )}
        </div>

        {/* Right Column: Agent Proposal Simulator */}
        <Surface level={2} headerTitle="Agent Proposal Simulator" headerMeta="TEST POLICY ENGINE">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Simulate an autonomous AI agent proposing an operation through WebMCP (`POST
            /api/tool-proposals`).
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', gap: '8px' }}
              disabled={simulatingAgent}
              onClick={() =>
                simulateAgentProposal('create_customer_with_invoice', {
                  name: custName,
                  email: custEmail,
                  amount: Number(invAmount),
                })
              }
            >
              <Bot size={14} style={{ color: 'var(--semantic-webmcp)' }} />
              <span>Propose: Customer & Invoice (HIGH RISK)</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', gap: '8px' }}
              disabled={simulatingAgent}
              onClick={() =>
                simulateAgentProposal('tool_refund_customer', {
                  customerId: refCustomerId,
                  amount: Number(refAmount),
                  reason: refReason,
                })
              }
            >
              <Bot size={14} style={{ color: 'var(--semantic-danger)' }} />
              <span>Propose: Customer Refund (CRITICAL)</span>
            </button>
          </div>

          {simulatingAgent && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Evaluating security policy and risk boundaries...
            </div>
          )}

          {agentProposalResponse && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <span
                  style={{
                    fontSize: '0.74rem',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                  }}
                >
                  Policy Decision
                </span>
                <Badge
                  variant={
                    agentProposalResponse.decision === 'ALLOW'
                      ? 'active'
                      : agentProposalResponse.decision === 'REQUIRE_HUMAN_AUTHORIZATION'
                        ? 'compensatable'
                        : 'risk-critical'
                  }
                >
                  {agentProposalResponse.decision || 'RESPONSE'}
                </Badge>
              </div>

              {agentProposalResponse.decision === 'REQUIRE_HUMAN_AUTHORIZATION' && (
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                    marginBottom: '12px',
                    fontSize: '0.78rem',
                  }}
                >
                  <div
                    style={{ color: 'var(--semantic-amber)', fontWeight: 600, marginBottom: '4px' }}
                  >
                    Human Authority Required:
                  </div>
                  <div style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    {agentProposalResponse.reason}
                  </div>
                  <button
                    type="button"
                    className="btn btn-accent"
                    style={{ fontSize: '0.76rem', padding: '5px 10px', gap: '6px' }}
                    onClick={() => {
                      if (agentProposalResponse.requirement) {
                        setPasskeyRequirement({
                          toolId: agentProposalResponse.requirement.toolId,
                          toolName: agentProposalResponse.requirement.toolId
                            .replace(/_/g, ' ')
                            .toUpperCase(),
                          toolVersion: agentProposalResponse.requirement.toolVersion,
                          riskLevel: agentProposalResponse.requirement.riskLevel,
                          reversibility: agentProposalResponse.requirement.reversibility,
                          arguments: {
                            name: custName,
                            email: custEmail,
                            amount: Number(invAmount),
                          },
                          requestId: agentProposalResponse.requirement.requestId,
                        });
                      }
                    }}
                  >
                    <Key size={12} />
                    <span>Authorize with WebAuthn Passkey</span>
                  </button>
                </div>
              )}

              <pre
                className="mono"
                style={{
                  background: 'var(--surface-0)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px',
                  fontSize: '0.74rem',
                  color: '#cbd5e1',
                  maxHeight: '260px',
                  overflowY: 'auto',
                }}
              >
                {JSON.stringify(agentProposalResponse, null, 2)}
              </pre>
            </div>
          )}
        </Surface>
      </div>

      {/* WebAuthn Ceremony Modal */}
      {passkeyRequirement && (
        <PasskeyAuthModal
          toolId={passkeyRequirement.toolId}
          toolName={passkeyRequirement.toolName}
          toolVersion={passkeyRequirement.toolVersion}
          riskLevel={passkeyRequirement.riskLevel}
          reversibility={passkeyRequirement.reversibility}
          arguments={passkeyRequirement.arguments}
          requestId={passkeyRequirement.requestId}
          onAuthorized={handlePasskeyAuthorized}
          onCancel={() => setPasskeyRequirement(null)}
        />
      )}
    </div>
  );
};
