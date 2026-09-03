import React, { useState } from 'react';
import { UserPlus, FileText, RotateCcw, Calendar, Check, AlertCircle } from 'lucide-react';
import { ActiveRecordingState } from '../components/RecordingBar.js';

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
  const [invCurrency, setInvCurrency] = useState('INR');

  const [refCustomerId, setRefCustomerId] = useState('cust_alice_smith');
  const [refAmount, setRefAmount] = useState('500');
  const [refReason, setRefReason] = useState('Damaged item');

  const [fupCustomerId, setFupCustomerId] = useState('cust_alice_smith');
  const [fupDate, setFupDate] = useState('2026-09-10');
  const [fupNotes, setFupNotes] = useState('Review account satisfaction');

  const executeAction = async (
    actionId: string,
    args: Record<string, unknown>,
    summary: string,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/demonstrations/execute-action', {
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

  return (
    <div className="main-content">
      <div className="header">
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Operations Console</h2>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Primary enterprise application domain. Commands execute through the trusted
            ActionRegistry.
          </div>
        </div>
        {recording && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '6px 12px',
              borderRadius: '8px',
              color: '#ef4444',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
            Active Recording: Intercepting semantic application actions
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px' }}>
        {/* Left Operation Nav */}
        <div className="card" style={{ padding: '16px' }}>
          <div
            style={{
              fontSize: '0.78rem',
              textTransform: 'uppercase',
              color: '#64748b',
              fontWeight: 700,
              marginBottom: '12px',
            }}
          >
            Available Operations
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              className={`btn ${activeForm === 'create_customer' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', gap: '10px' }}
              onClick={() => setActiveForm('create_customer')}
            >
              <UserPlus size={16} /> Create Customer
            </button>
            <button
              className={`btn ${activeForm === 'create_invoice' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', gap: '10px' }}
              onClick={() => setActiveForm('create_invoice')}
            >
              <FileText size={16} /> Create Invoice
            </button>
            <button
              className={`btn ${activeForm === 'issue_refund' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', gap: '10px' }}
              onClick={() => setActiveForm('issue_refund')}
            >
              <RotateCcw size={16} /> Issue Refund
            </button>
            <button
              className={`btn ${activeForm === 'schedule_followup' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', gap: '10px' }}
              onClick={() => setActiveForm('schedule_followup')}
            >
              <Calendar size={16} /> Schedule Follow-up
            </button>
          </div>
        </div>

        {/* Right Form & Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            {activeForm === 'create_customer' && (
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Create Customer</h3>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '16px' }}>
                  Registers a new customer record. Handled by trusted{' '}
                  <code className="mono">customer.create</code> action.
                </p>
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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
                  </div>
                  <div className="form-group" style={{ maxWidth: '200px' }}>
                    <label className="form-label">Currency</label>
                    <select
                      className="form-input"
                      value={custCurrency}
                      onChange={e => setCustCurrency(e.target.value)}
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Executing...' : 'Execute customer.create'}
                  </button>
                </form>
              </div>
            )}

            {activeForm === 'create_invoice' && (
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Create Invoice</h3>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '16px' }}>
                  Issues a billable invoice for an existing account. Handled by{' '}
                  <code className="mono">invoice.create</code>.
                </p>
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group">
                      <label className="form-label">Customer ID</label>
                      <input
                        type="text"
                        className="form-input"
                        value={invCustomerId}
                        onChange={e => setInvCustomerId(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Amount</label>
                      <input
                        type="number"
                        className="form-input"
                        value={invAmount}
                        onChange={e => setInvAmount(e.target.value)}
                        min="1"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ maxWidth: '200px' }}>
                    <label className="form-label">Currency</label>
                    <select
                      className="form-input"
                      value={invCurrency}
                      onChange={e => setInvCurrency(e.target.value)}
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Executing...' : 'Execute invoice.create'}
                  </button>
                </form>
              </div>
            )}

            {activeForm === 'issue_refund' && (
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Issue Refund</h3>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '16px' }}>
                  Issues customer refund. High risk action handled by{' '}
                  <code className="mono">refund.create</code>.
                </p>
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group">
                      <label className="form-label">Customer ID</label>
                      <input
                        type="text"
                        className="form-input"
                        value={refCustomerId}
                        onChange={e => setRefCustomerId(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Amount</label>
                      <input
                        type="number"
                        className="form-input"
                        value={refAmount}
                        onChange={e => setRefAmount(e.target.value)}
                        min="1"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reason</label>
                    <input
                      type="text"
                      className="form-input"
                      value={refReason}
                      onChange={e => setRefReason(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Executing...' : 'Execute refund.create'}
                  </button>
                </form>
              </div>
            )}

            {activeForm === 'schedule_followup' && (
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Schedule Follow-up</h3>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '16px' }}>
                  Queues customer support follow-up. Handled by{' '}
                  <code className="mono">followup.schedule</code>.
                </p>
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group">
                      <label className="form-label">Customer ID</label>
                      <input
                        type="text"
                        className="form-input"
                        value={fupCustomerId}
                        onChange={e => setFupCustomerId(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Date</label>
                      <input
                        type="date"
                        className="form-input"
                        value={fupDate}
                        onChange={e => setFupDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <input
                      type="text"
                      className="form-input"
                      value={fupNotes}
                      onChange={e => setFupNotes(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Executing...' : 'Execute followup.schedule'}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Result Output Card */}
          {error && (
            <div
              className="card"
              style={{ borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.05)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                <AlertCircle size={16} />
                <span style={{ fontWeight: 600 }}>Execution Failed: {error}</span>
              </div>
            </div>
          )}

          {lastResponse && (
            <div className="card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={16} style={{ color: 'var(--success)' }} />
                  <span style={{ fontWeight: 600 }}>
                    Operation Executed: {lastResponse.actionId}
                  </span>
                </div>
                {lastResponse.recorded && (
                  <span
                    className="badge badge-active"
                    style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}
                  >
                    Captured in Demonstration Trace
                  </span>
                )}
              </div>
              <pre
                className="mono"
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                }}
              >
                {JSON.stringify(lastResponse.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
