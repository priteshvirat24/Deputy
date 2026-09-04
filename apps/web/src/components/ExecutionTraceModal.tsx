import React from 'react';
import { X, CheckCircle2, AlertTriangle, Shield, ArrowDown } from 'lucide-react';
import { ToolExecutionResult, ToolProposal } from '@deputy/domain';
import { Badge } from './ui/Badge.js';

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
      className="drawer-backdrop"
      style={{ justifyContent: 'center', alignItems: 'center', padding: 20 }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="panel"
        style={{
          width: '680px',
          maxWidth: '92vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--surface-2)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-lg)',
          marginBottom: 0,
        }}
      >
        <div className="panel-header" style={{ background: 'var(--surface-1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} style={{ color: 'var(--semantic-audit)' }} />
            <h3
              style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}
            >
              Execution Trace Inspector
            </h3>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Status Outcome Banner */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: result.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${result.success ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
            }}
          >
            {result.success ? (
              <CheckCircle2 size={18} style={{ color: 'var(--semantic-emerald)' }} />
            ) : (
              <AlertTriangle size={18} style={{ color: 'var(--semantic-danger)' }} />
            )}
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: result.success ? 'var(--semantic-emerald)' : 'var(--semantic-danger)',
                }}
              >
                Execution Outcome: {result.outcome}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                Execution ID: <span className="mono">{result.executionId}</span> · Duration:{' '}
                {result.durationMs}ms
              </div>
            </div>
          </div>

          {/* Step-by-Step Flow Pipeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Stage 1: Proposal */}
            <div
              style={{
                background: 'var(--surface-1)',
                padding: '12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                }}
              >
                1. Autonomous Agent Proposal
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                Agent:{' '}
                <span className="mono" style={{ color: 'var(--semantic-auth)' }}>
                  {proposal.proposedBy.agentId}
                </span>{' '}
                · Origin: <span className="mono">{proposal.proposedBy.origin}</span>
              </div>
              <pre
                className="mono"
                style={{
                  margin: '8px 0 0 0',
                  fontSize: '0.74rem',
                  color: 'var(--semantic-audit)',
                  background: 'var(--surface-0)',
                  padding: 10,
                  borderRadius: 'var(--radius-xs)',
                }}
              >
                {JSON.stringify(proposal.arguments, null, 2)}
              </pre>
            </div>

            <div style={{ textAlign: 'center' }}>
              <ArrowDown size={14} style={{ color: 'var(--text-muted)' }} />
            </div>

            {/* Stage 2: Security Gate & Policy */}
            <div
              style={{
                background: 'var(--surface-1)',
                padding: '12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                }}
              >
                2. Security Gatekeeper & Argument Digest Verification
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Target:{' '}
                <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {result.toolId} (v{result.toolVersion})
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <ArrowDown size={14} style={{ color: 'var(--text-muted)' }} />
            </div>

            {/* Stage 3: Step Execution Records */}
            <div
              style={{
                background: 'var(--surface-1)',
                padding: '12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
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
                        borderRadius: 'var(--radius-xs)',
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border-default)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: '0.82rem',
                            color: 'var(--text-primary)',
                          }}
                        >
                          Step {step.stepOrder + 1}: {step.actionId} (v{step.actionVersion})
                        </span>
                        <Badge variant={step.status === 'SUCCESS' ? 'active' : 'risk-critical'}>
                          {step.status}
                        </Badge>
                      </div>
                      {step.compensationStatus !== 'NONE' &&
                        step.compensationStatus !== 'NOT_REQUIRED' && (
                          <div
                            style={{
                              fontSize: '0.74rem',
                              color: 'var(--semantic-amber)',
                              marginTop: '4px',
                            }}
                          >
                            Compensation Status: {step.compensationStatus}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {result.error?.message ||
                    'Single action executed directly through ActionRegistry.'}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close Inspector
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
