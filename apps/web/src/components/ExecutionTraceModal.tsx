import React from 'react';
import { X, CheckCircle2, AlertTriangle, Shield, ArrowDown } from 'lucide-react';
import { ToolExecutionResult, ToolProposal } from '@deputy/domain';

export interface ExecutionTraceModalProps {
  proposal: ToolProposal;
  result: ToolExecutionResult;
  onClose: () => void;
}

export const ExecutionTraceModal: React.FC<ExecutionTraceModalProps> = ({
  proposal,
  result,
  onClose,
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
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
          width: '680px',
          maxWidth: '92vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--card-bg)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
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
            <Shield size={20} color="#38bdf8" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
              Execution Trace Inspector
            </h3>
          </div>
          <button
            onClick={onClose}
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

        {/* Status Outcome Banner */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: result.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${result.success ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
          }}
        >
          {result.success ? (
            <CheckCircle2 size={20} color="#10b981" />
          ) : (
            <AlertTriangle size={20} color="#ef4444" />
          )}
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: '0.95rem',
                color: result.success ? '#10b981' : '#ef4444',
              }}
            >
              Execution Outcome: {result.outcome}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Execution ID: {result.executionId} • Duration: {result.durationMs}ms
            </div>
          </div>
        </div>

        {/* Step-by-Step Flow Pipeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Stage 1: Proposal */}
          <div
            style={{
              background: '#090d16',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
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
              1. Autonomous Agent Proposal
            </div>
            <div style={{ fontSize: '0.85rem', color: '#f8fafc', marginTop: '4px' }}>
              Agent:{' '}
              <span className="mono" style={{ color: '#38bdf8' }}>
                {proposal.proposedBy.agentId}
              </span>{' '}
              • Origin: <span className="mono">{proposal.proposedBy.origin}</span>
            </div>
            <pre
              className="mono"
              style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}
            >
              {JSON.stringify(proposal.arguments, null, 2)}
            </pre>
          </div>

          <div style={{ textAlign: 'center' }}>
            <ArrowDown size={14} color="#64748b" />
          </div>

          {/* Stage 2: Security Gate & Policy */}
          <div
            style={{
              background: '#090d16',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
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
              2. Security Gatekeeper & Argument Digest Verification
            </div>
            <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '4px' }}>
              Target:{' '}
              <span className="mono" style={{ color: '#38bdf8' }}>
                {result.toolId} (v{result.toolVersion})
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <ArrowDown size={14} color="#64748b" />
          </div>

          {/* Stage 3: Step Execution Records */}
          <div
            style={{
              background: '#090d16',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                color: '#64748b',
                fontWeight: 700,
                marginBottom: '8px',
              }}
            >
              3. Application ActionRegistry Executions
            </div>

            {result.stepRecords && result.stepRecords.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {result.stepRecords.map(step => (
                  <div
                    key={step.stepOrder}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#f8fafc' }}>
                        Step {step.stepOrder + 1}: {step.actionId} (v{step.actionVersion})
                      </span>
                      <span className={`badge badge-${step.status.toLowerCase()}`}>
                        {step.status}
                      </span>
                    </div>
                    {step.compensationStatus !== 'NONE' &&
                      step.compensationStatus !== 'NOT_REQUIRED' && (
                        <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '4px' }}>
                          Compensation Status: {step.compensationStatus}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                {result.error?.message || 'Single action executed directly through ActionRegistry.'}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
