import React from 'react';
import { AuditEvent } from '@deputy/domain';
import { ScrollText, CheckCircle2, XCircle, Info } from 'lucide-react';

interface AuditViewProps {
  events: AuditEvent[];
  onRefresh: () => void;
}

export const AuditView: React.FC<AuditViewProps> = ({ events, onRefresh }) => {
  return (
    <div className="page-body">
      <div className="page-header">
        <h2 className="page-title">Cryptographic Audit Trail</h2>
        <p className="page-description">
          Immutable, append-only ledger of demonstrations, tool lifecycle events, agent proposals,
          authorizations, and executions.
        </p>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ScrollText size={18} color="var(--accent-cyan)" />
            <h3 className="panel-title">Audit Log Stream ({events.length} entries)</h3>
          </div>
          <button className="btn btn-secondary" onClick={onRefresh}>
            Refresh
          </button>
        </div>

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
            {events.map(event => (
              <tr key={event.eventId}>
                <td className="mono" style={{ fontSize: '0.78rem' }}>
                  {new Date(event.timestamp).toLocaleTimeString()}
                </td>
                <td>
                  <span
                    className="badge badge-active"
                    style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}
                  >
                    {event.eventType}
                  </span>
                </td>
                <td>
                  {event.status === 'SUCCESS' ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#10b981',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      <CheckCircle2 size={14} /> SUCCESS
                    </span>
                  ) : event.status === 'FAILURE' ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#f43f5e',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      <XCircle size={14} /> FAILURE
                    </span>
                  ) : (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#94a3b8',
                        fontSize: '0.8rem',
                      }}
                    >
                      <Info size={14} /> INFO
                    </span>
                  )}
                </td>
                <td>
                  <div style={{ fontWeight: 500 }}>{event.actor.id}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {event.actor.type}
                  </div>
                </td>
                <td className="mono" style={{ color: '#38bdf8' }}>
                  {event.toolId
                    ? `${event.toolId}${event.toolVersion ? `@v${event.toolVersion}` : ''}`
                    : '—'}
                </td>
                <td className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {event.requestId || '—'}
                </td>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {event.reason || (event.metadata ? JSON.stringify(event.metadata) : '—')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
