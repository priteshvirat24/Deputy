import React, { useState, useMemo } from 'react';
import { AuditEvent } from '@deputy/domain';
import { ScrollText, Search, Eye, RefreshCw, Download } from 'lucide-react';
import { Badge } from '../components/ui/Badge.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { Surface } from '../components/ui/Surface.js';
import { Drawer } from '../components/ui/Drawer.js';
import { ProvenanceBadge } from '../components/ui/ProvenanceBadge.js';
import { useToast } from '../context/ToastContext.js';

interface AuditViewProps {
  auditEvents: AuditEvent[];
  onRefresh: () => void;
}

export const AuditView: React.FC<AuditViewProps> = ({ auditEvents, onRefresh }) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  const uniqueEventTypes = useMemo(() => {
    const set = new Set<string>();
    for (const ev of auditEvents) {
      if (ev.eventType) set.add(ev.eventType);
    }
    return Array.from(set);
  }, [auditEvents]);

  const filteredEvents = useMemo(() => {
    return auditEvents.filter(ev => {
      if (typeFilter !== 'ALL' && ev.eventType !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = ev.eventId.toLowerCase().includes(q);
        const matchType = ev.eventType.toLowerCase().includes(q);
        const matchActor = ev.actor.id.toLowerCase().includes(q);
        const matchSession = ev.sessionId ? ev.sessionId.toLowerCase().includes(q) : false;
        const matchReq = ev.requestId ? ev.requestId.toLowerCase().includes(q) : false;
        if (!matchId && !matchType && !matchActor && !matchSession && !matchReq) return false;
      }
      return true;
    });
  }, [auditEvents, typeFilter, searchQuery]);

  const exportAuditLog = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredEvents, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `deputy_audit_trail_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(
      'success',
      'Audit Exported',
      `Exported ${filteredEvents.length} cryptographic audit events.`,
    );
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
                color: 'var(--semantic-audit)',
                fontWeight: 700,
              }}
            >
              SECURITY FORENSICS
            </span>
            <span style={{ color: 'var(--border-strong)' }}>/</span>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              SHA-256 APPEND-ONLY LEDGER
            </span>
          </div>
          <h1 className="page-title">Cryptographic Audit Trail</h1>
          <p className="page-description">
            Append-only, immutable forensic event stream. Every demonstration, tool synthesis,
            passkey authorization, and execution is sealed with cryptographic hashes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onRefresh}
            style={{ gap: 5 }}
          >
            <RefreshCw size={13} />
            <span>Refresh Stream</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={exportAuditLog}
            style={{ gap: 5 }}
          >
            <Download size={13} />
            <span>Export Forensic JSON</span>
          </button>
        </div>
      </div>

      {/* Invariant 6 & 7 Banner */}
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
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--semantic-audit)',
              }}
            >
              <ScrollText size={16} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                Invariant 6 & 7: Append-Only Cryptographic Audit & Provenance Sealing
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                Ledger records are strictly append-only. Modification of past events is
                mathematically impossible without breaking the SHA-256 chain integrity.
              </div>
            </div>
          </div>
          <Badge variant="active">{auditEvents.length} IMMUTABLE EVENTS RECORDED</Badge>
        </div>
      </Surface>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: 32, fontSize: '0.82rem' }}
            placeholder="Search events by type, actor, or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {uniqueEventTypes.length > 0 && (
          <select
            className="form-select"
            style={{ width: 'auto', padding: '4px 10px', fontSize: '0.76rem' }}
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="ALL">All Event Types ({uniqueEventTypes.length})</option>
            {uniqueEventTypes.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Forensic Audit Events Table */}
      <Surface
        level={2}
        noPadding
        headerTitle="Forensic Event Ledger"
        headerMeta={`${filteredEvents.length} EVENTS`}
      >
        {filteredEvents.length === 0 ? (
          <div style={{ padding: 36 }}>
            <EmptyState
              icon={<ScrollText size={22} />}
              title="No Audit Records Found"
              description="Actions executed in the Operations Console or synthesized in the Studio emit cryptographic audit events."
            />
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event Type & ID</th>
                  <th>Timestamp</th>
                  <th>Actor ID</th>
                  <th>Status</th>
                  <th>Hash Digest</th>
                  <th>Provenance</th>
                  <th>Inspect</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map(ev => {
                  const isSelected = selectedEvent?.eventId === ev.eventId;
                  const trustClass = ev.provenance?.trustClass || 'FIRST_PARTY';

                  return (
                    <tr
                      key={ev.eventId}
                      className={`clickable ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedEvent(ev)}
                    >
                      <td>
                        <div
                          className="mono"
                          style={{
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            fontSize: '0.84rem',
                          }}
                        >
                          {ev.eventType}
                        </div>
                        <div
                          className="mono"
                          style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}
                        >
                          {ev.eventId}
                        </div>
                      </td>

                      <td>
                        <span
                          className="mono"
                          style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}
                        >
                          {new Date(ev.timestamp).toLocaleTimeString()}
                        </span>
                      </td>

                      <td>
                        <div
                          className="mono"
                          style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}
                        >
                          {ev.actor.id}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          {ev.actor.type} ({ev.actor.role})
                        </div>
                      </td>

                      <td>
                        <Badge
                          variant={
                            ev.status === 'SUCCESS'
                              ? 'active'
                              : ev.status === 'FAILURE'
                                ? 'risk-critical'
                                : 'draft'
                          }
                        >
                          {ev.status}
                        </Badge>
                      </td>

                      <td>
                        <span
                          className="mono"
                          style={{ fontSize: '0.72rem', color: 'var(--semantic-audit)' }}
                        >
                          {ev.eventHash ? `${ev.eventHash.slice(0, 12)}...` : 'SEALED'}
                        </span>
                      </td>

                      <td>
                        <ProvenanceBadge trustClass={trustClass} compact />
                      </td>

                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '2px 6px', fontSize: '0.72rem' }}
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedEvent(ev);
                          }}
                        >
                          <Eye size={11} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Surface>

      {/* Slide-Over Forensic Event Detail Drawer */}
      <Drawer
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.eventType || 'Audit Event'}
        subtitle={`Event ID: ${selectedEvent?.eventId}`}
        headerBadge={<Badge variant="auth">SHA-256 SEALED</Badge>}
      >
        {selectedEvent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Metadata grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 8,
                fontSize: '0.78rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Event Type: </span>
                <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {selectedEvent.eventType}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Status: </span>
                <Badge variant={selectedEvent.status === 'SUCCESS' ? 'active' : 'risk-critical'}>
                  {selectedEvent.status}
                </Badge>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Session ID: </span>
                <span className="mono">{selectedEvent.sessionId || 'N/A'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Request ID: </span>
                <span className="mono">{selectedEvent.requestId || 'N/A'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Actor: </span>
                <span className="mono">
                  {selectedEvent.actor.id} ({selectedEvent.actor.role})
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Timestamp: </span>
                <span className="mono">{new Date(selectedEvent.timestamp).toLocaleString()}</span>
              </div>
            </div>

            {/* Cryptographic Hash Chaining */}
            <div
              style={{
                background: 'var(--surface-2)',
                padding: 12,
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
                  marginBottom: 6,
                }}
              >
                Cryptographic Integrity Hashes
              </div>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.74rem' }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Event Hash: </span>
                  <span
                    className="mono"
                    style={{ color: 'var(--semantic-emerald)', wordBreak: 'break-all' }}
                  >
                    {selectedEvent.eventHash || 'SHA-256 Validated'}
                  </span>
                </div>
                {selectedEvent.previousEventHash && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Previous Hash: </span>
                    <span
                      className="mono"
                      style={{ color: 'var(--text-secondary)', wordBreak: 'break-all' }}
                    >
                      {selectedEvent.previousEventHash}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Event Metadata Payload */}
            <div>
              <div
                style={{
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                Event Metadata Payload
              </div>
              <pre
                className="mono"
                style={{
                  background: 'var(--surface-0)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 14,
                  fontSize: '0.75rem',
                  color: '#cbd5e1',
                  maxHeight: 280,
                  overflowY: 'auto',
                }}
              >
                {JSON.stringify(selectedEvent.metadata || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
