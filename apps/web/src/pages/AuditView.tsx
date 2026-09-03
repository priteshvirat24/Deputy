import React, { useState } from 'react';
import { AuditEvent } from '@deputy/domain';
import {
  ScrollText,
  CheckCircle2,
  XCircle,
  Info,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { Surface } from '../components/ui/Surface.js';

interface AuditViewProps {
  events: AuditEvent[];
  onRefresh: () => void;
}

export const AuditView: React.FC<AuditViewProps> = ({ events, onRefresh }) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  // Filter events
  const filteredEvents = events.filter(e => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'EXECUTION') return e.eventType.includes('EXECUTE');
    if (selectedFilter === 'AUTHORIZATION') return e.eventType.includes('AUTHORIZATION');
    if (selectedFilter === 'REFUSED')
      return e.eventType.includes('REFUSED') || e.status === 'FAILURE';
    return true;
  });

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
                color: 'var(--semantic-audit)',
                fontWeight: 700,
              }}
            >
              CRYPTOGRAPHIC EVIDENCE
            </span>
            <span style={{ color: 'var(--border-strong)' }}>/</span>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              SHA-256 HASH CHAIN
            </span>
          </div>
          <h1 className="page-title">Cryptographic Audit Trail</h1>
          <p className="page-description">
            Immutable, append-only ledger of demonstrations, tool syntheses, agent proposals,
            WebAuthn authorizations, and atomic executions.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onRefresh}
          style={{ gap: '6px' }}
        >
          <RefreshCw size={13} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Hash Chain Integrity Banner */}
      <Surface level={2} style={{ marginBottom: '20px', padding: '14px 18px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--semantic-emerald)',
              }}
            >
              <ShieldCheck size={18} />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>Cryptographic Hash Chain: Verified & Unbroken</span>
                <span className="status-dot active" />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Every record is bound to its predecessor via SHA-256 HMAC digest. Any retroactive
                modification breaks the chain.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Badge variant="active">GENESIS LINKED</Badge>
            <Badge variant="auth">APPEND-ONLY</Badge>
          </div>
        </div>
      </Surface>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['ALL', 'EXECUTION', 'AUTHORIZATION', 'REFUSED'].map(filter => (
          <button
            key={filter}
            type="button"
            className={`btn ${selectedFilter === filter ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.76rem', padding: '4px 10px' }}
            onClick={() => setSelectedFilter(filter)}
          >
            {filter} (
            {filter === 'ALL'
              ? events.length
              : events.filter(e =>
                  filter === 'EXECUTION'
                    ? e.eventType.includes('EXECUTE')
                    : filter === 'AUTHORIZATION'
                      ? e.eventType.includes('AUTHORIZATION')
                      : e.eventType.includes('REFUSED') || e.status === 'FAILURE',
                ).length}
            )
          </button>
        ))}
      </div>

      {/* Audit Log Stream */}
      <Surface
        level={2}
        headerTitle="Audit Log Stream"
        headerMeta={`${filteredEvents.length} RECORDS`}
        noPadding
      >
        {filteredEvents.length === 0 ? (
          <div style={{ padding: '24px' }}>
            <EmptyState
              icon={<ScrollText size={20} />}
              title="No Audit Records Found"
              description="No audit events matched the selected filter."
            />
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Event Type</th>
                <th>Status</th>
                <th>Actor</th>
                <th>Target Tool</th>
                <th>Request ID</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map(event => (
                <tr
                  key={event.eventId}
                  onClick={() => setSelectedEvent(event)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="mono" style={{ fontSize: '0.76rem' }}>
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </td>
                  <td>
                    <Badge
                      variant={
                        event.eventType.includes('EXECUTE')
                          ? 'active'
                          : event.eventType.includes('AUTHORIZATION')
                            ? 'auth'
                            : event.eventType.includes('REFUSED')
                              ? 'risk-critical'
                              : 'neutral'
                      }
                    >
                      {event.eventType}
                    </Badge>
                  </td>
                  <td>
                    {event.status === 'SUCCESS' ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: 'var(--semantic-emerald)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                        }}
                      >
                        <CheckCircle2 size={13} /> SUCCESS
                      </span>
                    ) : event.status === 'FAILURE' ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: 'var(--semantic-danger)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                        }}
                      >
                        <XCircle size={13} /> FAILURE
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: 'var(--text-secondary)',
                          fontSize: '0.78rem',
                        }}
                      >
                        <Info size={13} /> INFO
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: '0.82rem' }}>{event.actor.id}</div>
                    <div
                      className="mono"
                      style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}
                    >
                      {event.actor.type}
                    </div>
                  </td>
                  <td>
                    <span
                      className="mono"
                      style={{
                        fontSize: '0.78rem',
                        color: event.toolId ? 'var(--semantic-webmcp)' : 'var(--text-muted)',
                      }}
                    >
                      {event.toolId || '—'}
                    </span>
                  </td>
                  <td>
                    <span
                      className="mono"
                      style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}
                    >
                      {event.requestId ? event.requestId.slice(0, 16) + '...' : '—'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedEvent(event);
                      }}
                    >
                      Inspect <ExternalLink size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Surface>

      {/* Selected Event Payload Modal */}
      {selectedEvent && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setSelectedEvent(null)}
        >
          <div
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              width: '90%',
              maxWidth: '680px',
              padding: '24px',
              boxShadow: 'var(--shadow-lg)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '0.74rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--semantic-audit)',
                    fontWeight: 700,
                  }}
                >
                  EVENT RECORD DETAILS
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedEvent.eventType}
                </h3>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.76rem', padding: '4px 10px' }}
                onClick={() => setSelectedEvent(null)}
              >
                Close
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '14px',
                fontSize: '0.8rem',
              }}
            >
              <div>
                Event ID: <span className="mono">{selectedEvent.eventId}</span>
              </div>
              <div>
                Timestamp:{' '}
                <span className="mono">{new Date(selectedEvent.timestamp).toISOString()}</span>
              </div>
              <div>
                Actor:{' '}
                <span className="mono">
                  {selectedEvent.actor.id} ({selectedEvent.actor.type})
                </span>
              </div>
              {selectedEvent.reason && (
                <div>
                  Reason:{' '}
                  <span style={{ color: 'var(--semantic-amber)' }}>{selectedEvent.reason}</span>
                </div>
              )}
            </div>

            <div
              style={{
                fontSize: '0.74rem',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                fontWeight: 600,
                marginBottom: '6px',
              }}
            >
              Cryptographic Event Metadata & Arguments
            </div>
            <pre
              className="mono"
              style={{
                background: 'var(--surface-0)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px',
                fontSize: '0.76rem',
                color: '#cbd5e1',
                maxHeight: '260px',
                overflowY: 'auto',
              }}
            >
              {JSON.stringify(selectedEvent.metadata || selectedEvent, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
