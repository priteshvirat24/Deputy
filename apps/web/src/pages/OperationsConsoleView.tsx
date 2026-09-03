import React, { useState } from 'react';
import {
  UserPlus,
  UserCheck,
  UserX,
  FileText,
  RotateCcw,
  Calendar,
  Clock,
  Play,
  Bot,
  Key,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { ActiveRecordingState } from '../components/RecordingBar.js';
import { PasskeyAuthModal } from '../components/PasskeyAuthModal.js';
import { Badge } from '../components/ui/Badge.js';
import { Surface } from '../components/ui/Surface.js';
import { useToast } from '../context/ToastContext.js';

interface OperationsConsoleProps {
  recording: ActiveRecordingState | null;
  onActionObserved?: (actionType: string, summary: string) => void;
}

type ActionKey =
  | 'customer.create'
  | 'customer.update'
  | 'customer.archive'
  | 'invoice.create'
  | 'refund.create'
  | 'meeting.schedule'
  | 'followup.schedule';

interface ActionMetadata {
  id: ActionKey;
  version: number;
  name: string;
  category: 'CUSTOMERS' | 'BILLING' | 'SCHEDULING';
  description: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reversibility: 'REVERSIBLE' | 'COMPENSATABLE' | 'IRREVERSIBLE';
  binding: string;
  requiredPermissions: string[];
  sideEffects: string[];
  authRequirement: string;
}

const ACTION_METADATA_MAP: Record<ActionKey, ActionMetadata> = {
  'customer.create': {
    id: 'customer.create',
    version: 1,
    name: 'Create Customer Profile',
    category: 'CUSTOMERS',
    description: 'Creates a verified customer profile in the operational CRM database.',
    riskLevel: 'MEDIUM',
    reversibility: 'COMPENSATABLE',
    binding: 'ActionRegistry.customer.create',
    requiredPermissions: ['customer.write'],
    sideEffects: ['Writes customer record', 'Sends welcome email'],
    authRequirement: 'Autonomous within policy limits',
  },
  'customer.update': {
    id: 'customer.update',
    version: 1,
    name: 'Update Customer Profile',
    category: 'CUSTOMERS',
    description: 'Updates contact details and preferences on an existing customer account.',
    riskLevel: 'MEDIUM',
    reversibility: 'REVERSIBLE',
    binding: 'ActionRegistry.customer.update',
    requiredPermissions: ['customer.profile.write'],
    sideEffects: ['Updates CRM database record'],
    authRequirement: 'Autonomous within policy limits',
  },
  'customer.archive': {
    id: 'customer.archive',
    version: 1,
    name: 'Archive Customer Account',
    category: 'CUSTOMERS',
    description: 'Permanently archives an account, revokes credentials, and freezes records.',
    riskLevel: 'CRITICAL',
    reversibility: 'IRREVERSIBLE',
    binding: 'ActionRegistry.customer.archive',
    requiredPermissions: ['admin.account.archive'],
    sideEffects: ['Account frozen', 'API tokens revoked', 'Irreversible compliance flag set'],
    authRequirement: 'FIDO2 WebAuthn UV Mandatory',
  },
  'invoice.create': {
    id: 'invoice.create',
    version: 1,
    name: 'Create Customer Invoice',
    category: 'BILLING',
    description: 'Generates a billable accounts receivable invoice for an account.',
    riskLevel: 'HIGH',
    reversibility: 'COMPENSATABLE',
    binding: 'ActionRegistry.invoice.create',
    requiredPermissions: ['finance.invoice.write'],
    sideEffects: ['Generates accounts receivable invoice', 'Notifies customer'],
    authRequirement: 'Human Authorization for amounts > ₹0',
  },
  'refund.create': {
    id: 'refund.create',
    version: 1,
    name: 'Create Customer Refund',
    category: 'BILLING',
    description: 'Issues a monetary refund to a previous customer transaction.',
    riskLevel: 'HIGH',
    reversibility: 'COMPENSATABLE',
    binding: 'ActionRegistry.refund.create',
    requiredPermissions: ['finance.refund.write'],
    sideEffects: ['Deducts balance', 'Sends refund notification email', 'Emits ledger event'],
    authRequirement: 'FIDO2 WebAuthn UV Mandatory',
  },
  'meeting.schedule': {
    id: 'meeting.schedule',
    version: 1,
    name: 'Schedule Customer Meeting',
    category: 'SCHEDULING',
    description: 'Books a calendar appointment with account representatives.',
    riskLevel: 'LOW',
    reversibility: 'REVERSIBLE',
    binding: 'ActionRegistry.meeting.schedule',
    requiredPermissions: ['calendar.events.write'],
    sideEffects: ['Calendar invite dispatched'],
    authRequirement: 'Autonomous allowed',
  },
  'followup.schedule': {
    id: 'followup.schedule',
    version: 1,
    name: 'Schedule Follow-up Task',
    category: 'SCHEDULING',
    description: 'Creates a pending reminder task in the operations queue.',
    riskLevel: 'LOW',
    reversibility: 'REVERSIBLE',
    binding: 'ActionRegistry.followup.schedule',
    requiredPermissions: ['tasks.write'],
    sideEffects: ['Queues reminder task in operations queue'],
    authRequirement: 'Autonomous allowed',
  },
};

export const OperationsConsoleView: React.FC<OperationsConsoleProps> = ({
  recording,
  onActionObserved,
}) => {
  const { showToast } = useToast();
  const [activeActionKey, setActiveActionKey] = useState<ActionKey>('customer.create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Last executed result
  const [lastExecution, setLastExecution] = useState<{
    actionId: string;
    version: number;
    arguments: Record<string, unknown>;
    result: unknown;
    correlationId: string;
    recorded: boolean;
    timestamp: string;
  } | null>(null);

  // Form states
  const [custName, setCustName] = useState('Alice Smith');
  const [custEmail, setCustEmail] = useState('alice@example.com');
  const [custCurrency, setCustCurrency] = useState('INR');

  const [updateCustId, setUpdateCustId] = useState('cust_alice_smith');
  const [updateCustName, setUpdateCustName] = useState('Alice Smith (Updated)');
  const [updateCustEmail, setUpdateCustEmail] = useState('alice.smith@example.com');

  const [archiveCustId, setArchiveCustId] = useState('cust_alice_smith');
  const [archiveReason, setArchiveReason] = useState('Account migration completed');

  const [invCustomerId, setInvCustomerId] = useState('cust_alice_smith');
  const [invAmount, setInvAmount] = useState('2500');
  const [invCurrency, setInvCurrency] = useState('INR');

  const [refCustomerId, setRefCustomerId] = useState('cust_alice_smith');
  const [refAmount, setRefAmount] = useState('1000');
  const [refReason, setRefReason] = useState('Customer requested partial refund');

  const [meetCustomerId, setMeetCustomerId] = useState('cust_alice_smith');
  const [meetDate, setMeetDate] = useState('2026-09-15T10:00');
  const [meetDuration, setMeetDuration] = useState('30');

  const [fupCustomerId, setFupCustomerId] = useState('cust_alice_smith');
  const [fupDate, setFupDate] = useState('2026-09-18');
  const [fupNotes, setFupNotes] = useState('Check quarterly account satisfaction');

  // Agent proposal simulation state
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

  // Quick Preset Helper for Demonstration creation
  const applyPreset = (name: string, email: string, amount: string) => {
    setCustName(name);
    setCustEmail(email);
    const generatedId = `cust_${name.toLowerCase().replace(/\s+/g, '_')}`;
    setInvCustomerId(generatedId);
    setInvAmount(amount);
    setUpdateCustId(generatedId);
    setArchiveCustId(generatedId);
    setRefCustomerId(generatedId);
    setMeetCustomerId(generatedId);
    setFupCustomerId(generatedId);
    showToast('info', 'Preset Applied', `${name} · ₹${amount}`);
  };

  const currentMeta = ACTION_METADATA_MAP[activeActionKey];

  // Execute Real Action
  const executeAction = async (
    actionId: ActionKey,
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
        throw new Error(json.error?.message || 'Action execution failed');
      }

      const executionData = {
        actionId,
        version: 1,
        arguments: args,
        result: json.data.result,
        correlationId: json.data.result?.correlationId || `corr_${Date.now()}`,
        recorded: !!json.data.recordedAction,
        timestamp: new Date().toISOString(),
      };

      setLastExecution(executionData);

      if (recording && onActionObserved) {
        onActionObserved(actionId, summary);
      }

      showToast(
        'success',
        `Executed ${actionId}`,
        recording
          ? `Semantic action recorded in demonstration trace (${summary})`
          : `Action completed successfully: ${summary}`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      showToast('error', 'Execution Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  // Autonomous Agent Simulator
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
            agentId: 'autonomous_operations_agent',
            origin: window.location.origin,
          },
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      setAgentProposalResponse(data);

      if (data.decision === 'REQUIRE_HUMAN_AUTHORIZATION') {
        showToast(
          'auth',
          'Policy Requirement',
          'Human authority & Passkey UV required for high-risk proposal.',
        );
        setPasskeyRequirement({
          toolId,
          toolName: toolId.replace(/_/g, ' ').toUpperCase(),
          toolVersion: 1,
          riskLevel: data.requirement?.riskLevel || 'HIGH',
          reversibility: data.requirement?.reversibility || 'COMPENSATABLE',
          arguments: args,
          requestId,
        });
      } else if (data.decision === 'ALLOW') {
        showToast(
          'success',
          'Proposal Approved & Executed',
          `Outcome: ${data.execution?.outcome || 'SUCCESS'}`,
        );
      } else if (data.decision === 'DENY') {
        showToast('error', 'Proposal Denied by Policy', data.reason);
      }
    } catch (err: unknown) {
      setAgentProposalResponse({ error: String(err) });
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
            agentId: 'autonomous_operations_agent',
            origin: window.location.origin,
          },
          timestamp: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      setAgentProposalResponse(data);
      setPasskeyRequirement(null);
      showToast(
        'success',
        'Authorization Consumed',
        'Operation executed atomically through secure gateway.',
      );
    } catch (err: unknown) {
      showToast('error', 'Execution Failed', String(err));
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
              OPERATIONS WORKSPACE
            </span>
            <span style={{ color: 'var(--border-strong)' }}>/</span>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              TRUSTED ACTION REGISTRY
            </span>
          </div>
          <h1 className="page-title">Operations Console</h1>
          <p className="page-description">
            Execute native domain actions directly against the trusted application. When recording
            is active, actions are captured as semantic demonstration evidence.
          </p>
        </div>

        {/* Preset Selector Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            PRESETS:
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => applyPreset('Alice Smith', 'alice@example.com', '2500')}
          >
            Alice (₹2,500)
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => applyPreset('Bob Jones', 'bob@example.com', '4200')}
          >
            Bob (₹4,200)
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => applyPreset('Charlie Brown', 'charlie@example.com', '4200')}
          >
            Charlie (₹4,200)
          </button>
        </div>
      </div>

      {/* Semantic Intent Invariant Banner */}
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
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--semantic-auth)',
              }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                Semantic Intent Capture Engine
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                DEPUTY records typed parameters (e.g.{' '}
                <code>customer.create&#123;name, email&#125;</code>) bound to trusted handlers,
                never raw click coordinates or fragile DOM macros.
              </div>
            </div>
          </div>
          <Badge variant="auth">INVARIANT 1 & 2 ENFORCED</Badge>
        </div>
      </Surface>

      {/* 3-Column Layout: Action Explorer (Left) | Execution Surface (Center) | Agent Proposal Simulator (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1.2fr 1fr', gap: 20 }}>
        {/* Left Column: Domain Navigation */}
        <Surface level={2} headerTitle="Registered Actions" headerMeta="DOMAIN CATALOG">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Customers Group */}
            <div>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  marginBottom: 6,
                }}
              >
                CUSTOMERS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <button
                  type="button"
                  className={`btn ${activeActionKey === 'customer.create' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    justifyContent: 'flex-start',
                    width: '100%',
                    gap: 8,
                    padding: '6px 10px',
                  }}
                  onClick={() => setActiveActionKey('customer.create')}
                >
                  <UserPlus size={14} style={{ color: 'var(--semantic-auth)' }} />
                  <span style={{ flex: 1, textAlign: 'left' }}>Create Customer</span>
                  <Badge variant="risk-medium">MED</Badge>
                </button>

                <button
                  type="button"
                  className={`btn ${activeActionKey === 'customer.update' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    justifyContent: 'flex-start',
                    width: '100%',
                    gap: 8,
                    padding: '6px 10px',
                  }}
                  onClick={() => setActiveActionKey('customer.update')}
                >
                  <UserCheck size={14} style={{ color: 'var(--semantic-webmcp)' }} />
                  <span style={{ flex: 1, textAlign: 'left' }}>Update Customer</span>
                  <Badge variant="risk-medium">MED</Badge>
                </button>

                <button
                  type="button"
                  className={`btn ${activeActionKey === 'customer.archive' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    justifyContent: 'flex-start',
                    width: '100%',
                    gap: 8,
                    padding: '6px 10px',
                  }}
                  onClick={() => setActiveActionKey('customer.archive')}
                >
                  <UserX size={14} style={{ color: 'var(--semantic-danger)' }} />
                  <span style={{ flex: 1, textAlign: 'left' }}>Archive Customer</span>
                  <Badge variant="risk-critical">CRIT</Badge>
                </button>
              </div>
            </div>

            {/* Billing Group */}
            <div>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  marginBottom: 6,
                }}
              >
                BILLING & PAYMENTS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <button
                  type="button"
                  className={`btn ${activeActionKey === 'invoice.create' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    justifyContent: 'flex-start',
                    width: '100%',
                    gap: 8,
                    padding: '6px 10px',
                  }}
                  onClick={() => setActiveActionKey('invoice.create')}
                >
                  <FileText size={14} style={{ color: 'var(--semantic-amber)' }} />
                  <span style={{ flex: 1, textAlign: 'left' }}>Create Invoice</span>
                  <Badge variant="risk-high">HIGH</Badge>
                </button>

                <button
                  type="button"
                  className={`btn ${activeActionKey === 'refund.create' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    justifyContent: 'flex-start',
                    width: '100%',
                    gap: 8,
                    padding: '6px 10px',
                  }}
                  onClick={() => setActiveActionKey('refund.create')}
                >
                  <RotateCcw size={14} style={{ color: 'var(--semantic-danger)' }} />
                  <span style={{ flex: 1, textAlign: 'left' }}>Issue Refund</span>
                  <Badge variant="risk-high">HIGH</Badge>
                </button>
              </div>
            </div>

            {/* Scheduling Group */}
            <div>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  marginBottom: 6,
                }}
              >
                SCHEDULING & TASKS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <button
                  type="button"
                  className={`btn ${activeActionKey === 'meeting.schedule' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    justifyContent: 'flex-start',
                    width: '100%',
                    gap: 8,
                    padding: '6px 10px',
                  }}
                  onClick={() => setActiveActionKey('meeting.schedule')}
                >
                  <Calendar size={14} style={{ color: 'var(--semantic-emerald)' }} />
                  <span style={{ flex: 1, textAlign: 'left' }}>Schedule Meeting</span>
                  <Badge variant="risk-low">LOW</Badge>
                </button>

                <button
                  type="button"
                  className={`btn ${activeActionKey === 'followup.schedule' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    justifyContent: 'flex-start',
                    width: '100%',
                    gap: 8,
                    padding: '6px 10px',
                  }}
                  onClick={() => setActiveActionKey('followup.schedule')}
                >
                  <Clock size={14} style={{ color: 'var(--semantic-emerald)' }} />
                  <span style={{ flex: 1, textAlign: 'left' }}>Schedule Follow-up</span>
                  <Badge variant="risk-low">LOW</Badge>
                </button>
              </div>
            </div>
          </div>
        </Surface>

        {/* Center Column: Deliberate Action Form & Execution Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Action Specification Surface */}
          <Surface level={2}>
            {/* Action Identity & Metadata Bar */}
            <div
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    className="mono"
                    style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}
                  >
                    {currentMeta.id}
                  </span>
                  <Badge variant="draft">v{currentMeta.version}</Badge>
                  <Badge variant={`risk-${currentMeta.riskLevel.toLowerCase()}` as any}>
                    {currentMeta.riskLevel} RISK
                  </Badge>
                  <Badge variant={currentMeta.reversibility.toLowerCase() as any}>
                    {currentMeta.reversibility}
                  </Badge>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                {currentMeta.description}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 6,
                  fontSize: '0.74rem',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: 8,
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Target: </span>
                  <span className="mono" style={{ color: 'var(--semantic-auth)' }}>
                    {currentMeta.binding}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Authority: </span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {currentMeta.authRequirement}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Required Role: </span>
                  <span className="mono">{currentMeta.requiredPermissions.join(', ')}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Origin Match: </span>
                  <span className="mono" style={{ color: 'var(--semantic-emerald)' }}>
                    http://localhost:5173
                  </span>
                </div>
              </div>
            </div>

            {/* 1. Customer Create Form */}
            {activeActionKey === 'customer.create' && (
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
                <div className="form-group">
                  <label className="form-label">Customer Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={custName}
                    onChange={e => setCustName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={custEmail}
                    onChange={e => setCustEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Preferred Currency</label>
                  <select
                    className="form-select"
                    value={custCurrency}
                    onChange={e => setCustCurrency(e.target.value)}
                  >
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ width: '100%', marginTop: 8, gap: 6 }}
                >
                  <Play size={13} />
                  <span>{loading ? 'Executing Action...' : 'Execute customer.create'}</span>
                </button>
              </form>
            )}

            {/* 2. Customer Update Form */}
            {activeActionKey === 'customer.update' && (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  executeAction(
                    'customer.update',
                    { customerId: updateCustId, name: updateCustName, email: updateCustEmail },
                    updateCustId,
                  );
                }}
              >
                <div className="form-group">
                  <label className="form-label">Customer ID</label>
                  <input
                    type="text"
                    className="form-input mono"
                    value={updateCustId}
                    onChange={e => setUpdateCustId(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Updated Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={updateCustName}
                    onChange={e => setUpdateCustName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Updated Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={updateCustEmail}
                    onChange={e => setUpdateCustEmail(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ width: '100%', marginTop: 8, gap: 6 }}
                >
                  <Play size={13} />
                  <span>{loading ? 'Updating Record...' : 'Execute customer.update'}</span>
                </button>
              </form>
            )}

            {/* 3. Customer Archive Form */}
            {activeActionKey === 'customer.archive' && (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  executeAction(
                    'customer.archive',
                    { customerId: archiveCustId, reason: archiveReason },
                    archiveCustId,
                  );
                }}
              >
                <div className="form-group">
                  <label className="form-label">Customer ID to Freeze</label>
                  <input
                    type="text"
                    className="form-input mono"
                    value={archiveCustId}
                    onChange={e => setArchiveCustId(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Compliance Reason for Archival</label>
                  <input
                    type="text"
                    className="form-input"
                    value={archiveReason}
                    onChange={e => setArchiveReason(e.target.value)}
                    required
                  />
                </div>

                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    fontSize: '0.76rem',
                    color: 'var(--semantic-danger)',
                    marginBottom: 12,
                  }}
                >
                  <strong>CRITICAL IRREVERSIBLE OPERATION:</strong> This action permanently archives
                  the customer ledger and disables associated API tokens.
                </div>

                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={loading}
                  style={{ width: '100%', gap: 6 }}
                >
                  <Play size={13} />
                  <span>
                    {loading ? 'Freezing Account...' : 'Execute customer.archive (CRITICAL)'}
                  </span>
                </button>
              </form>
            )}

            {/* 4. Invoice Create Form */}
            {activeActionKey === 'invoice.create' && (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  executeAction(
                    'invoice.create',
                    { customerId: invCustomerId, amount: Number(invAmount), currency: invCurrency },
                    `₹${invAmount}`,
                  );
                }}
              >
                <div className="form-group">
                  <label className="form-label">Target Customer ID</label>
                  <input
                    type="text"
                    className="form-input mono"
                    value={invCustomerId}
                    onChange={e => setInvCustomerId(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Invoice Amount</label>
                  <input
                    type="number"
                    className="form-input mono"
                    value={invAmount}
                    onChange={e => setInvAmount(e.target.value)}
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <select
                    className="form-select"
                    value={invCurrency}
                    onChange={e => setInvCurrency(e.target.value)}
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
                  style={{ width: '100%', marginTop: 8, gap: 6 }}
                >
                  <Play size={13} />
                  <span>
                    {loading ? 'Creating Invoice...' : 'Execute invoice.create (HIGH RISK)'}
                  </span>
                </button>
              </form>
            )}

            {/* 5. Refund Create Form */}
            {activeActionKey === 'refund.create' && (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  executeAction(
                    'refund.create',
                    { customerId: refCustomerId, amount: Number(refAmount), reason: refReason },
                    `₹${refAmount}`,
                  );
                }}
              >
                <div className="form-group">
                  <label className="form-label">Customer ID</label>
                  <input
                    type="text"
                    className="form-input mono"
                    value={refCustomerId}
                    onChange={e => setRefCustomerId(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Refund Amount</label>
                  <input
                    type="number"
                    className="form-input mono"
                    value={refAmount}
                    onChange={e => setRefAmount(e.target.value)}
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reason for Refund</label>
                  <input
                    type="text"
                    className="form-input"
                    value={refReason}
                    onChange={e => setRefReason(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={loading}
                  style={{ width: '100%', marginTop: 8, gap: 6 }}
                >
                  <Play size={13} />
                  <span>
                    {loading ? 'Processing Refund...' : 'Execute refund.create (HIGH RISK)'}
                  </span>
                </button>
              </form>
            )}

            {/* 6. Meeting Schedule Form */}
            {activeActionKey === 'meeting.schedule' && (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  executeAction(
                    'meeting.schedule',
                    {
                      customerId: meetCustomerId,
                      date: meetDate,
                      durationMinutes: Number(meetDuration),
                    },
                    meetDate,
                  );
                }}
              >
                <div className="form-group">
                  <label className="form-label">Customer ID</label>
                  <input
                    type="text"
                    className="form-input mono"
                    value={meetCustomerId}
                    onChange={e => setMeetCustomerId(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Scheduled Appointment Date & Time</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={meetDate}
                    onChange={e => setMeetDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Duration (Minutes)</label>
                  <input
                    type="number"
                    className="form-input mono"
                    value={meetDuration}
                    onChange={e => setMeetDuration(e.target.value)}
                    min="15"
                    step="15"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ width: '100%', marginTop: 8, gap: 6 }}
                >
                  <Play size={13} />
                  <span>{loading ? 'Booking Meeting...' : 'Execute meeting.schedule'}</span>
                </button>
              </form>
            )}

            {/* 7. Followup Schedule Form */}
            {activeActionKey === 'followup.schedule' && (
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
                <div className="form-group">
                  <label className="form-label">Customer ID</label>
                  <input
                    type="text"
                    className="form-input mono"
                    value={fupCustomerId}
                    onChange={e => setFupCustomerId(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Follow-up Target Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={fupDate}
                    onChange={e => setFupDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes & Follow-up Instructions</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={fupNotes}
                    onChange={e => setFupNotes(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ width: '100%', marginTop: 8, gap: 6 }}
                >
                  <Play size={13} />
                  <span>{loading ? 'Queueing Task...' : 'Execute followup.schedule'}</span>
                </button>
              </form>
            )}
          </Surface>

          {/* Execution Feedback / Semantic Intent Captured Surface */}
          {error && (
            <Surface
              level={2}
              style={{
                borderColor: 'rgba(244, 63, 94, 0.4)',
                background: 'rgba(244, 63, 94, 0.05)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--semantic-danger)',
                  fontSize: '0.84rem',
                }}
              >
                <AlertTriangle size={16} />
                <span style={{ fontWeight: 600 }}>Execution Failed: {error}</span>
              </div>
            </Surface>
          )}

          {lastExecution && (
            <Surface
              level={2}
              headerTitle="Semantic Action Captured"
              headerMeta={lastExecution.actionId}
              headerAction={
                lastExecution.recorded ? (
                  <Badge variant="active">Captured in Demonstration</Badge>
                ) : (
                  <Badge variant="draft">Executed Direct</Badge>
                )
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: 'var(--semantic-emerald)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 size={14} />
                    <span>
                      Action Executed via {lastExecution.actionId}@v{lastExecution.version}
                    </span>
                  </div>
                  <span
                    className="mono"
                    style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}
                  >
                    {lastExecution.correlationId}
                  </span>
                </div>

                {/* Arguments captured */}
                <div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      fontWeight: 700,
                      marginBottom: 4,
                    }}
                  >
                    Captured Semantic Arguments
                  </div>
                  <pre
                    className="mono"
                    style={{
                      background: 'var(--surface-0)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 10px',
                      fontSize: '0.75rem',
                      color: 'var(--semantic-audit)',
                      maxHeight: 120,
                      overflowY: 'auto',
                    }}
                  >
                    {JSON.stringify(lastExecution.arguments, null, 2)}
                  </pre>
                </div>

                {/* Handler Output */}
                <div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      fontWeight: 700,
                      marginBottom: 4,
                    }}
                  >
                    Handler Return Value
                  </div>
                  <pre
                    className="mono"
                    style={{
                      background: 'var(--surface-0)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 10px',
                      fontSize: '0.75rem',
                      color: '#cbd5e1',
                      maxHeight: 120,
                      overflowY: 'auto',
                    }}
                  >
                    {JSON.stringify(lastExecution.result, null, 2)}
                  </pre>
                </div>
              </div>
            </Surface>
          )}
        </div>

        {/* Right Column: Autonomous Agent Proposal Simulator */}
        <Surface level={2} headerTitle="Agent Proposal Simulator" headerMeta="TEST POLICY ENGINE">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
            Simulate an autonomous AI agent proposing execution through the WebMCP gateway (`POST
            /api/tool-proposals`).
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', gap: 8, padding: '8px 12px' }}
              disabled={simulatingAgent}
              onClick={() =>
                simulateAgentProposal('create_customer_with_invoice', {
                  name: custName,
                  email: custEmail,
                  amount: Number(invAmount),
                })
              }
            >
              <Bot size={15} style={{ color: 'var(--semantic-webmcp)' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                  Propose: Customer & Invoice
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  High-risk composite tool · Human required
                </div>
              </div>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', gap: 8, padding: '8px 12px' }}
              disabled={simulatingAgent}
              onClick={() =>
                simulateAgentProposal('tool_refund_customer', {
                  customerId: refCustomerId,
                  amount: Number(refAmount),
                  reason: refReason,
                })
              }
            >
              <Bot size={15} style={{ color: 'var(--semantic-danger)' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>Propose: Customer Refund</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  High-risk monetary operation · Passkey UV required
                </div>
              </div>
            </button>
          </div>

          {simulatingAgent && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
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
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    fontWeight: 700,
                  }}
                >
                  Policy Gate Decision
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
                    marginBottom: 12,
                    fontSize: '0.78rem',
                  }}
                >
                  <div style={{ color: 'var(--semantic-amber)', fontWeight: 600, marginBottom: 4 }}>
                    Human Authority Required:
                  </div>
                  <div style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
                    {agentProposalResponse.reason}
                  </div>
                  <button
                    type="button"
                    className="btn btn-accent btn-sm"
                    style={{ gap: 6 }}
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
                  padding: 10,
                  fontSize: '0.74rem',
                  color: '#cbd5e1',
                  maxHeight: 220,
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
