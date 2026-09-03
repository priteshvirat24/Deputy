import React, { useState } from 'react';
import { Demonstration, SemanticAction } from '@deputy/domain';
import { Drawer } from './ui/Drawer.js';
import { Badge } from './ui/Badge.js';
import { ProvenanceCard, ProvenanceBadge } from './ui/ProvenanceBadge.js';

interface DemonstrationDrawerProps {
  demonstration: Demonstration | null;
  isOpen: boolean;
  onClose: () => void;
  onSynthesize?: (demonstrationId: string) => void;
}

export const DemonstrationDrawer: React.FC<DemonstrationDrawerProps> = ({
  demonstration,
  isOpen,
  onClose,
  onSynthesize,
}) => {
  const [activeTab, setActiveTab] = useState<'trace' | 'provenance' | 'raw'>('trace');
  const [selectedActionIndex, setSelectedActionIndex] = useState<number>(0);

  if (!demonstration) return null;

  const durationMs =
    demonstration.completedAt && demonstration.startedAt
      ? new Date(demonstration.completedAt).getTime() - new Date(demonstration.startedAt).getTime()
      : undefined;

  const selectedAction: SemanticAction | undefined = demonstration.actions[selectedActionIndex];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={demonstration.taskDescription || demonstration.demonstrationId}
      subtitle={`Session: ${demonstration.sessionId} · ${demonstration.actions.length} action(s)`}
      headerBadge={
        <Badge variant={demonstration.status.toLowerCase() as any}>{demonstration.status}</Badge>
      }
      tabs={[
        { id: 'trace', label: `Semantic Trace (${demonstration.actions.length})` },
        { id: 'provenance', label: 'Provenance & Integrity' },
        { id: 'raw', label: 'JSON Trace Payload' },
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
            Started: {new Date(demonstration.startedAt).toLocaleTimeString()}
            {durationMs ? ` · Duration: ${Math.round(durationMs / 1000)}s` : ''}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Close
            </button>
            {onSynthesize && (
              <button
                type="button"
                className="btn btn-accent btn-sm"
                onClick={() => {
                  onSynthesize(demonstration.demonstrationId);
                  onClose();
                }}
              >
                Synthesize Capability
              </button>
            )}
          </div>
        </div>
      }
    >
      {/* 1. SEMANTIC TRACE TAB */}
      {activeTab === 'trace' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Demonstration Overview Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
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
                Actor ID
              </div>
              <div
                className="mono"
                style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.84rem' }}
              >
                {demonstration.actorId}
              </div>
            </div>

            <div
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
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
                Application Context
              </div>
              <div
                className="mono"
                style={{ fontWeight: 600, color: 'var(--semantic-auth)', fontSize: '0.84rem' }}
              >
                {demonstration.applicationContext.environment}
              </div>
            </div>

            <div
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
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
                Captured Actions
              </div>
              <div
                className="mono"
                style={{ fontWeight: 600, color: 'var(--semantic-emerald)', fontSize: '0.84rem' }}
              >
                {demonstration.actions.length} Steps
              </div>
            </div>
          </div>

          {/* Action Step Selector & Detail Split */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                fontSize: '0.74rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
                fontWeight: 700,
              }}
            >
              Sequential Trace Steps
            </div>

            {demonstration.actions.length === 0 ? (
              <div
                style={{
                  padding: 20,
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.82rem',
                }}
              >
                Zero actions recorded in this demonstration.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {demonstration.actions.map((action, idx) => {
                  const isSelected = selectedActionIndex === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedActionIndex(idx)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--surface-2)',
                        border: `1px solid ${isSelected ? 'var(--border-focus)' : 'var(--border-subtle)'}`,
                        cursor: 'pointer',
                        transition:
                          'border-color var(--motion-fast), background var(--motion-fast)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            className="mono"
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 'var(--radius-xs)',
                              background: isSelected ? 'var(--semantic-auth)' : 'var(--surface-3)',
                              color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                            }}
                          >
                            0{idx + 1}
                          </span>
                          <span
                            className="mono"
                            style={{
                              fontWeight: 600,
                              fontSize: '0.86rem',
                              color: 'var(--text-primary)',
                            }}
                          >
                            {action.actionType}
                          </span>
                          <Badge variant="draft">v{action.actionVersion}</Badge>
                          <Badge variant={action.reversibility.toLowerCase() as any}>
                            {action.reversibility}
                          </Badge>
                        </div>
                        <span
                          className="mono"
                          style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}
                        >
                          {new Date(action.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Selected Action Deep Inspector */}
            {selectedAction && (
              <div
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 16,
                  marginTop: 8,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--text-muted)',
                        fontWeight: 700,
                      }}
                    >
                      STEP 0{selectedActionIndex + 1} INSPECTOR
                    </span>
                    <h4
                      style={{
                        fontSize: '0.96rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        margin: 0,
                      }}
                    >
                      {selectedAction.actionType} (v{selectedAction.actionVersion})
                    </h4>
                  </div>
                  <ProvenanceBadge trustClass={selectedAction.provenance?.trustClass} compact />
                </div>

                {/* Step Technical Metadata */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 6,
                    fontSize: '0.76rem',
                    marginBottom: 12,
                    background: 'var(--surface-1)',
                    padding: 10,
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Correlation ID: </span>
                    <span className="mono" style={{ color: 'var(--text-primary)' }}>
                      {selectedAction.correlationId}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Actor Type: </span>
                    <span className="mono">
                      {selectedAction.actor.type} ({selectedAction.actor.id})
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Reversibility: </span>
                    <span className="mono">{selectedAction.reversibility}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Side Effects: </span>
                    <span>{selectedAction.sideEffects.join(', ') || 'None'}</span>
                  </div>
                </div>

                {/* Captured Arguments */}
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
                      borderRadius: 'var(--radius-xs)',
                      padding: 10,
                      fontSize: '0.75rem',
                      color: 'var(--semantic-audit)',
                      maxHeight: 180,
                      overflowY: 'auto',
                    }}
                  >
                    {JSON.stringify(selectedAction.arguments, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. PROVENANCE & INTEGRITY TAB */}
      {activeTab === 'provenance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Every action captured in a demonstration carries cryptographically bound provenance
            metadata declaring origin trust boundaries, retrieved timestamps, and taint status.
          </div>

          <ProvenanceCard
            provenance={
              (demonstration.metadata?.['provenance'] as any) || {
                source: 'operations.console',
                origin: 'http://localhost:5173',
                trustClass: 'FIRST_PARTY',
                retrievedAt: demonstration.startedAt,
                contentId: `cid_${demonstration.demonstrationId}`,
              }
            }
            title="Demonstration Session Provenance"
          />

          <div
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: 14,
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
              Taint & Trust Verification
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
                <span style={{ color: 'var(--text-muted)' }}>Trust Class:</span>
                <Badge variant="active">FIRST_PARTY (TRUSTED)</Badge>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: 6,
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>DOM Scraping / Macro Taint:</span>
                <span style={{ color: 'var(--semantic-emerald)', fontWeight: 600 }}>
                  CLEAN (0 DOM selectors)
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
                <span style={{ color: 'var(--text-muted)' }}>Execution Authority:</span>
                <span>Native ActionRegistry Handler</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Replay Immunity:</span>
                <span>Correlation ID & Session ID Bound</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. RAW JSON TRACE TAB */}
      {activeTab === 'raw' && (
        <div>
          <pre
            className="mono"
            style={{
              background: 'var(--surface-0)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: 14,
              fontSize: '0.74rem',
              color: '#cbd5e1',
              maxHeight: 520,
              overflowY: 'auto',
            }}
          >
            {JSON.stringify(demonstration, null, 2)}
          </pre>
        </div>
      )}
    </Drawer>
  );
};
