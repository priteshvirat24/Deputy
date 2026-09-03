import React, { useState } from 'react';
import { Demonstration } from '@deputy/domain';
import { Video, Sparkles, Eye } from 'lucide-react';
import { Badge } from '../components/ui/Badge.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { Surface } from '../components/ui/Surface.js';

interface DemonstrationsViewProps {
  demonstrations: Demonstration[];
}

export const DemonstrationsView: React.FC<DemonstrationsViewProps> = ({ demonstrations }) => {
  const [selectedDemo, setSelectedDemo] = useState<Demonstration | null>(
    demonstrations.length > 0 ? (demonstrations[0] ?? null) : null,
  );

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
                color: 'var(--semantic-auth)',
                fontWeight: 700,
              }}
            >
              LEARNING EVIDENCE
            </span>
            <span style={{ color: 'var(--border-strong)' }}>/</span>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              SEMANTIC TRACES
            </span>
          </div>
          <h1 className="page-title">Demonstrations & Semantic Traces</h1>
          <p className="page-description">
            Empirical evidence recorded from human operator tasks. DEPUTY captures structured
            semantic calls rather than fragile DOM click macros.
          </p>
        </div>
      </div>

      {/* Invariant 1 Highlight Surface */}
      <Surface level={2} style={{ marginBottom: '20px', padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
              Invariant 1: No DOM Macros
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              Demonstrations record typed, parameter-bound application action sequences (e.g.{' '}
              <code>customer.create</code>, <code>invoice.create</code>), completely immune to DOM
              structural refactorings or CSS selector breakage.
            </div>
          </div>
        </div>
      </Surface>

      {/* Main Grid: Left Traces List + Right Trace Step Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Left Traces List */}
        <Surface
          level={2}
          headerTitle="Recorded Task Traces"
          headerMeta={`${demonstrations.length} RECORDED`}
          noPadding
        >
          {demonstrations.length === 0 ? (
            <div style={{ padding: '24px' }}>
              <EmptyState
                icon={<Video size={20} />}
                title="No Demonstrations Recorded"
                description="Use the Operations Console with recording active to capture human task execution."
              />
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Demonstration ID</th>
                  <th>Status</th>
                  <th>Actor</th>
                  <th>Actions</th>
                  <th>Started At</th>
                  <th>Inspect</th>
                </tr>
              </thead>
              <tbody>
                {demonstrations.map(demo => {
                  const isSelected = selectedDemo?.demonstrationId === demo.demonstrationId;
                  return (
                    <tr
                      key={demo.demonstrationId}
                      onClick={() => setSelectedDemo(demo)}
                      style={
                        isSelected
                          ? { background: 'var(--surface-3)', cursor: 'pointer' }
                          : { cursor: 'pointer' }
                      }
                    >
                      <td>
                        <div
                          className="mono"
                          style={{
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            fontSize: '0.82rem',
                          }}
                        >
                          {demo.demonstrationId}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {demo.taskDescription || 'Enterprise task'}
                        </div>
                      </td>
                      <td>
                        <Badge variant={demo.status.toLowerCase() as any}>{demo.status}</Badge>
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: '0.78rem' }}>
                          {demo.actorId}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 600,
                            color: 'var(--semantic-auth)',
                            fontSize: '0.82rem',
                          }}
                        >
                          {demo.actions.length} action(s)
                        </span>
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: '0.74rem' }}>
                          {new Date(demo.startedAt).toLocaleTimeString()}
                        </span>
                      </td>
                      <td>
                        <Eye size={13} style={{ color: 'var(--text-muted)' }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Surface>

        {/* Right Step Inspector */}
        <Surface
          level={2}
          headerTitle="Semantic Action Sequence"
          headerMeta={selectedDemo ? selectedDemo.demonstrationId : 'SELECT TRACE'}
        >
          {!selectedDemo ? (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Select a demonstration on the left to inspect its structured action trace.
            </div>
          ) : selectedDemo.actions.length === 0 ? (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              This demonstration contains zero recorded actions.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedDemo.actions.map((act, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--surface-1)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Badge variant="draft">STEP {idx + 1}</Badge>
                      <span
                        className="mono"
                        style={{
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          fontSize: '0.84rem',
                        }}
                      >
                        {act.actionId} (v{act.actionVersion})
                      </span>
                    </div>
                    <span
                      className="mono"
                      style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}
                    >
                      {new Date(act.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      fontWeight: 600,
                      marginBottom: '4px',
                    }}
                  >
                    Captured Arguments
                  </div>
                  <pre
                    className="mono"
                    style={{
                      background: 'var(--surface-0)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 10px',
                      fontSize: '0.74rem',
                      color: '#cbd5e1',
                      overflowX: 'auto',
                    }}
                  >
                    {JSON.stringify(act.arguments, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </Surface>
      </div>
    </div>
  );
};
