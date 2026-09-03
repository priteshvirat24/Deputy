import React, { useState, useMemo } from 'react';
import { Demonstration } from '@deputy/domain';
import { Video, Search, Eye, Sparkles, ArrowUpDown, Clock, Layers } from 'lucide-react';
import { Badge } from '../components/ui/Badge.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { Surface } from '../components/ui/Surface.js';
import { DemonstrationDrawer } from '../components/DemonstrationDrawer.js';
import { ProvenanceBadge } from '../components/ui/ProvenanceBadge.js';

interface DemonstrationsViewProps {
  demonstrations: Demonstration[];
  onNavigateToSynthesis?: (demoId?: string) => void;
}

export const DemonstrationsView: React.FC<DemonstrationsViewProps> = ({
  demonstrations,
  onNavigateToSynthesis,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [actorFilter, setActorFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'actions'>('date');
  const [sortAsc, setSortAsc] = useState(false);

  // Inspector Drawer state
  const [selectedDemo, setSelectedDemo] = useState<Demonstration | null>(null);

  // Extract unique actors
  const uniqueActors = useMemo(() => {
    const set = new Set<string>();
    for (const d of demonstrations) {
      if (d.actorId) set.add(d.actorId);
    }
    return Array.from(set);
  }, [demonstrations]);

  // Filtered and sorted demonstrations
  const filteredDemonstrations = useMemo(() => {
    return demonstrations
      .filter(demo => {
        // Status filter
        if (statusFilter !== 'ALL' && demo.status !== statusFilter) return false;
        // Actor filter
        if (actorFilter !== 'ALL' && demo.actorId !== actorFilter) return false;
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchId = demo.demonstrationId.toLowerCase().includes(q);
          const matchTask = (demo.taskDescription || '').toLowerCase().includes(q);
          const matchActor = demo.actorId.toLowerCase().includes(q);
          const matchActions = demo.actions.some(a => a.actionType.toLowerCase().includes(q));
          if (!matchId && !matchTask && !matchActor && !matchActions) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'actions') {
          const diff = a.actions.length - b.actions.length;
          return sortAsc ? diff : -diff;
        }
        const timeA = new Date(a.startedAt).getTime();
        const timeB = new Date(b.startedAt).getTime();
        return sortAsc ? timeA - timeB : timeB - timeA;
      });
  }, [demonstrations, statusFilter, actorFilter, searchQuery, sortBy, sortAsc]);

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
              DEMONSTRATION REPOSITORY
            </span>
          </div>
          <h1 className="page-title">Demonstrations & Semantic Traces</h1>
          <p className="page-description">
            Empirical evidence library recorded from human operator tasks. DEPUTY captures
            structured application intent without DOM macros.
          </p>
        </div>

        {onNavigateToSynthesis && (
          <button
            type="button"
            className="btn btn-accent"
            onClick={() => onNavigateToSynthesis()}
            style={{ gap: 6 }}
          >
            <Sparkles size={14} />
            <span>Open Synthesis Studio</span>
          </button>
        )}
      </div>

      {/* Invariant 1 Highlight Banner */}
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
              <Video size={16} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                Invariant 1: No DOM Click Macros
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                Demonstrations record typed, parameter-bound application action sequences (e.g.{' '}
                <code>customer.create</code>, <code>invoice.create</code>), completely immune to DOM
                structural changes or CSS refactorings.
              </div>
            </div>
          </div>
          <Badge variant="active">{demonstrations.length} EVIDENCE TRACES RECORDED</Badge>
        </div>
      </Surface>

      {/* Filter and Search Toolbar */}
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
        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 260 }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 360,
            }}
          >
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
              placeholder="Search by task, action, ID, or actor..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Badges & Sort Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Status filter */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'var(--surface-2)',
              padding: '2px 4px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
                paddingLeft: 6,
              }}
            >
              STATUS:
            </span>
            {['ALL', 'COMPLETED', 'RECORDING', 'DISCARDED'].map(st => (
              <button
                key={st}
                type="button"
                className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '3px 8px', fontSize: '0.72rem', border: 'none' }}
                onClick={() => setStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Actor filter */}
          {uniqueActors.length > 1 && (
            <select
              className="form-select"
              style={{ width: 'auto', padding: '4px 10px', fontSize: '0.76rem' }}
              value={actorFilter}
              onChange={e => setActorFilter(e.target.value)}
            >
              <option value="ALL">All Actors ({uniqueActors.length})</option>
              {uniqueActors.map(a => (
                <option key={a} value={a}>
                  Actor: {a}
                </option>
              ))}
            </select>
          )}

          {/* Sorting */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              if (sortBy === 'date') {
                setSortAsc(!sortAsc);
              } else {
                setSortBy('date');
                setSortAsc(false);
              }
            }}
            style={{ gap: 4, fontSize: '0.74rem' }}
          >
            <Clock size={12} />
            <span>Time</span>
            <ArrowUpDown size={11} style={{ color: 'var(--text-muted)' }} />
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              if (sortBy === 'actions') {
                setSortAsc(!sortAsc);
              } else {
                setSortBy('actions');
                setSortAsc(false);
              }
            }}
            style={{ gap: 4, fontSize: '0.74rem' }}
          >
            <Layers size={12} />
            <span>Actions</span>
            <ArrowUpDown size={11} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
      </div>

      {/* Evidence Table */}
      <Surface
        level={2}
        noPadding
        headerTitle="Demonstration Evidence Library"
        headerMeta={`${filteredDemonstrations.length} MATCHES`}
      >
        {filteredDemonstrations.length === 0 ? (
          <div style={{ padding: 36 }}>
            <EmptyState
              icon={<Video size={22} />}
              title="No Demonstrations Found"
              description={
                demonstrations.length === 0
                  ? 'No task traces recorded yet. Go to the Operations Console to demonstrate an enterprise task.'
                  : 'No demonstrations matched the selected search query and status filters.'
              }
            />
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Demonstration ID & Task</th>
                  <th>Status</th>
                  <th>Actor</th>
                  <th>Action Sequence</th>
                  <th>Recorded At</th>
                  <th>Trust Class</th>
                  <th>Inspect</th>
                </tr>
              </thead>
              <tbody>
                {filteredDemonstrations.map(demo => {
                  const isSelected = selectedDemo?.demonstrationId === demo.demonstrationId;
                  const trustClass =
                    (demo.metadata?.['provenance'] as any)?.trustClass || 'FIRST_PARTY';

                  return (
                    <tr
                      key={demo.demonstrationId}
                      className={`clickable ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedDemo(demo)}
                    >
                      <td>
                        <div
                          style={{
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            fontSize: '0.86rem',
                          }}
                        >
                          {demo.taskDescription || demo.demonstrationId}
                        </div>
                        <div
                          className="mono"
                          style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}
                        >
                          {demo.demonstrationId} · Session: {demo.sessionId}
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
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            flexWrap: 'wrap',
                          }}
                        >
                          {demo.actions.length === 0 ? (
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              0 actions
                            </span>
                          ) : (
                            demo.actions.map((act, i) => (
                              <span
                                key={i}
                                className="mono"
                                style={{
                                  fontSize: '0.72rem',
                                  padding: '1px 6px',
                                  borderRadius: 'var(--radius-xs)',
                                  background: 'var(--surface-3)',
                                  border: '1px solid var(--border-subtle)',
                                  color: 'var(--semantic-auth)',
                                }}
                              >
                                {act.actionType}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      <td>
                        <span
                          className="mono"
                          style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}
                        >
                          {new Date(demo.startedAt).toLocaleTimeString()}
                        </span>
                      </td>

                      <td>
                        <ProvenanceBadge trustClass={trustClass} compact />
                      </td>

                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '0.72rem', gap: 4 }}
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedDemo(demo);
                          }}
                        >
                          <Eye size={12} />
                          <span>Inspect</span>
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

      {/* Slide-over Demonstration Inspector Drawer */}
      <DemonstrationDrawer
        demonstration={selectedDemo}
        isOpen={!!selectedDemo}
        onClose={() => setSelectedDemo(null)}
        onSynthesize={onNavigateToSynthesis}
      />
    </div>
  );
};
