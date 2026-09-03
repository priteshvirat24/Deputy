import React, { useState } from 'react';
import { LearnedTool, ToolLifecycleState } from '@deputy/domain';
import { Drawer } from './ui/Drawer.js';
import { Badge } from './ui/Badge.js';
import { JsonSchemaViewer } from './ui/JsonSchemaViewer.js';
import { AlertTriangle, Play } from 'lucide-react';
import { useToast } from '../context/ToastContext.js';

interface CapabilityDrawerProps {
  tool: LearnedTool | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onTestInvocation?: (tool: LearnedTool) => void;
}

export const CapabilityDrawer: React.FC<CapabilityDrawerProps> = ({
  tool,
  isOpen,
  onClose,
  onRefresh,
  onTestInvocation,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'execution' | 'evidence' | 'security' | 'lifecycle'
  >('overview');
  const [transitioning, setTransitioning] = useState(false);
  const [confirmRetire, setConfirmRetire] = useState(false);

  if (!tool) return null;

  const handleStatusTransition = async (newStatus: ToolLifecycleState, reason: string) => {
    setTransitioning(true);
    try {
      const res = await fetch(`http://localhost:4000/api/tools/${tool.toolId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Lifecycle transition failed');
      }

      showToast(
        'success',
        `Capability ${newStatus}`,
        `Tool "${tool.name}" transitioned to ${newStatus}. WebMCP capabilities updated.`,
      );
      setConfirmRetire(false);
      onRefresh();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('error', 'Transition Failed', msg);
    } finally {
      setTransitioning(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={tool.name}
      subtitle={`ID: ${tool.toolId} · v${tool.version}`}
      headerBadge={<Badge variant={tool.status.toLowerCase() as any}>{tool.status}</Badge>}
      tabs={[
        { id: 'overview', label: 'Overview' },
        { id: 'execution', label: 'Execution Binding' },
        { id: 'evidence', label: 'Evidence & Provenance' },
        { id: 'security', label: 'Policy & Security' },
        { id: 'lifecycle', label: 'Lifecycle Operations' },
      ]}
      activeTab={activeTab}
      onTabChange={tab => setActiveTab(tab as any)}
      footer={
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            alignItems: 'center',
          }}
        >
          <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Updated: {new Date(tool.updatedAt).toLocaleTimeString()}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Close
            </button>
            {onTestInvocation && tool.status === 'ACTIVE' && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onTestInvocation(tool);
                }}
                style={{ gap: 5 }}
              >
                <Play size={12} />
                <span>Test Execution</span>
              </button>
            )}
          </div>
        </div>
      }
    >
      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
            {tool.description}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <div
              style={{
                background: 'var(--surface-2)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              >
                Risk Tier
              </div>
              <Badge variant={`risk-${tool.riskLevel.toLowerCase()}` as any}>
                {tool.riskLevel}
              </Badge>
            </div>

            <div
              style={{
                background: 'var(--surface-2)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              >
                Reversibility
              </div>
              <Badge variant={tool.reversibility.toLowerCase() as any}>{tool.reversibility}</Badge>
            </div>

            <div
              style={{
                background: 'var(--surface-2)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              >
                Creator / Authority
              </div>
              <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                {tool.creator.id} ({tool.creator.role})
              </div>
            </div>

            <div
              style={{
                background: 'var(--surface-2)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              >
                WebMCP Status
              </div>
              <span
                style={{
                  fontSize: '0.78rem',
                  color: tool.status === 'ACTIVE' ? 'var(--semantic-emerald)' : 'var(--text-muted)',
                  fontWeight: 600,
                }}
              >
                {tool.status === 'ACTIVE' ? 'REGISTERED & EXECUTABLE' : 'UNREGISTERED'}
              </span>
            </div>
          </div>

          {/* JSON Schema Contract */}
          <div>
            <JsonSchemaViewer
              schema={tool.inputSchema}
              title="Input Schema Contract"
              maxHeight={220}
            />
          </div>
        </div>
      )}

      {/* 2. EXECUTION BINDING TAB */}
      {activeTab === 'execution' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Invariant 2: Capabilities execute exclusively through registered native application
            handlers in <code>ActionRegistry</code>, never arbitrary strings or runtime eval.
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
              Binding Architecture: {tool.executionBinding.type}
            </div>

            {tool.executionBinding.type === 'COMPOSITE_ACTION' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tool.executionBinding.actions.map(act => (
                  <div
                    key={act.stepOrder}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'var(--surface-1)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-xs)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        className="mono"
                        style={{
                          color: 'var(--semantic-auth)',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                        }}
                      >
                        Step {act.stepOrder + 1}
                      </span>
                      <span
                        className="mono"
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--text-primary)',
                          fontWeight: 600,
                        }}
                      >
                        {act.actionId} (v{act.actionVersion})
                      </span>
                    </div>
                    <Badge variant="draft">Native Handler</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: '8px 12px',
                  background: 'var(--surface-1)',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <span
                  className="mono"
                  style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}
                >
                  ActionRegistry.{tool.executionBinding.actionId} (v
                  {tool.executionBinding.actionVersion})
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. EVIDENCE & PROVENANCE TAB */}
      {activeTab === 'evidence' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            This capability was deterministically synthesized from {tool.demonstrationCount} human
            demonstration trace(s).
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
              Source Demonstration Traces
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tool.sourceDemonstrations.map(demoId => (
                <div
                  key={demoId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    background: 'var(--surface-1)',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span
                    className="mono"
                    style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}
                  >
                    {demoId}
                  </span>
                  <Badge variant="active">EVIDENCE LINKED</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. SECURITY & POLICY TAB */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
              Approval Policy Configuration
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.78rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: 6,
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>Requires Human Authorization:</span>
                <span
                  style={{
                    fontWeight: 600,
                    color: tool.approvalPolicy.requiresHumanAuthorization
                      ? 'var(--semantic-amber)'
                      : 'var(--semantic-emerald)',
                  }}
                >
                  {tool.approvalPolicy.requiresHumanAuthorization
                    ? 'YES (FIDO2 WebAuthn UV Required)'
                    : 'NO (Autonomous Allowed)'}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: 6,
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>Required Roles:</span>
                <span className="mono">
                  {tool.approvalPolicy.requiredRoles.join(', ') || 'Any authorized operator'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Max Autonomous Risk:</span>
                <span className="mono">{tool.approvalPolicy.maxAutonomousRiskLevel}</span>
              </div>
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
              Origin Restrictions (WHATWG Exact Match)
            </div>
            <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--semantic-emerald)' }}>
              {window.location.origin}
            </div>
          </div>
        </div>
      )}

      {/* 5. LIFECYCLE OPERATIONS TAB */}
      {activeTab === 'lifecycle' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Lifecycle transitions are irreversible security boundaries. Retiring a tool removes its
            capability descriptor from WebMCP while preserving all historical audit trails.
          </div>

          {/* Current Status Box */}
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
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
                Current Lifecycle State
              </span>
              <Badge variant={tool.status.toLowerCase() as any}>{tool.status}</Badge>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              {tool.status === 'ACTIVE' && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={transitioning}
                  onClick={() =>
                    handleStatusTransition('DISABLED', 'Operator disabled tool temporarily')
                  }
                >
                  Disable Capability
                </button>
              )}

              {tool.status === 'DISABLED' && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={transitioning}
                  onClick={() => handleStatusTransition('ACTIVE', 'Operator re-enabled tool')}
                >
                  Re-enable Capability
                </button>
              )}

              {tool.status !== 'RETIRED' && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  disabled={transitioning}
                  onClick={() => setConfirmRetire(true)}
                >
                  Retire Capability
                </button>
              )}
            </div>
          </div>

          {/* Retirement Consequence Warning Modal / Section */}
          {confirmRetire && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: 'var(--radius-sm)',
                padding: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--semantic-danger)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  marginBottom: 6,
                }}
              >
                <AlertTriangle size={16} />
                <span>Confirm Capability Retirement</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                Retiring <strong>{tool.name}</strong> has the following deterministic consequences:
              </p>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  fontSize: '0.76rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  marginBottom: 14,
                }}
              >
                <li>
                  It will immediately become non-executable (Invariant 9: Inactive tools fail
                  closed).
                </li>
                <li>
                  WebMCP registration will be unregistered from browser runtime and in-flight
                  signals aborted.
                </li>
                <li>
                  All historical audit records, cryptographic hashes, and demonstrations remain
                  permanently intact.
                </li>
              </ul>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setConfirmRetire(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  disabled={transitioning}
                  onClick={() =>
                    handleStatusTransition('RETIRED', 'Permanently retired by authorized operator')
                  }
                >
                  Confirm Retirement
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
};
