import React, { useEffect, useState } from 'react';
import { Circle, Pause, Play, CheckCircle, Trash2, Video, Terminal } from 'lucide-react';

export interface RecordedActionItem {
  actionType: string;
  summary: string;
  sequenceNumber: number;
  timestamp: string;
}

export interface ActiveRecordingState {
  demonstrationId: string;
  sessionId: string;
  taskDescription: string;
  status: 'RECORDING' | 'PAUSED';
  startedAt: number;
  actionCount: number;
  actionTrace?: RecordedActionItem[];
  lastAction?: { actionType: string; summary: string };
}

interface RecordingBarProps {
  recording: ActiveRecordingState | null;
  onStart: (taskDescription: string) => Promise<void>;
  onPause: () => Promise<void>;
  onResume: () => Promise<void>;
  onComplete: () => Promise<void>;
  onDiscard: () => Promise<void>;
}

export const RecordingBar: React.FC<RecordingBarProps> = ({
  recording,
  onStart,
  onPause,
  onResume,
  onComplete,
  onDiscard,
}) => {
  const [elapsed, setElapsed] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [taskInput, setTaskInput] = useState('Create Customer and Bill Initial Invoice');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!recording || recording.status === 'PAUSED') return;

    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - recording.startedAt) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [recording]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskInput.trim()) return;
    setLoading(true);
    try {
      await onStart(taskInput.trim());
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  };

  if (!recording) {
    return (
      <>
        <div
          style={{
            background: 'var(--surface-1)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '10px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 52,
            zIndex: 30,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--text-disabled)',
              }}
            />
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Demonstration Recorder: <strong style={{ color: 'var(--text-primary)' }}>IDLE</strong>{' '}
              · Perform enterprise actions to capture a semantic demonstration trace.
            </span>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowModal(true)}
            style={{ gap: 6 }}
          >
            <Video size={13} />
            <span>Start Demonstration</span>
          </button>
        </div>

        {showModal && (
          <div
            className="drawer-backdrop"
            style={{ justifyContent: 'center', alignItems: 'center', padding: 20 }}
            onClick={e => {
              if (e.target === e.currentTarget) setShowModal(false);
            }}
          >
            <div
              className="panel"
              style={{
                width: 480,
                maxWidth: '100%',
                marginBottom: 0,
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <div className="panel-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Video size={16} style={{ color: 'var(--semantic-recording)' }} />
                  <span className="panel-title">Start Task Demonstration</span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowModal(false)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleStartSubmit} style={{ padding: 20 }}>
                <p
                  style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16 }}
                >
                  Demonstrate a multi-step task by executing real application actions in the
                  Operations Console. DEPUTY records semantic application calls, not pixels or
                  fragile DOM macros.
                </p>

                <div className="form-group">
                  <label className="form-label">Task Objective / Description</label>
                  <input
                    type="text"
                    className="form-input"
                    value={taskInput}
                    onChange={e => setTaskInput(e.target.value)}
                    placeholder="e.g. Create Customer and Bill Initial Invoice"
                    required
                    autoFocus
                  />
                </div>

                <div
                  style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-accent" disabled={loading}>
                    {loading ? 'Starting...' : 'Begin Live Recording'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  const isPaused = recording.status === 'PAUSED';

  return (
    <div
      style={{
        background: isPaused ? 'rgba(245, 158, 11, 0.08)' : 'rgba(244, 63, 94, 0.08)',
        borderBottom: `1px solid ${isPaused ? 'rgba(245, 158, 11, 0.35)' : 'rgba(244, 63, 94, 0.35)'}`,
        padding: '10px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        position: 'sticky',
        top: 52,
        zIndex: 30,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Top Recording Instrument Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Status Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Circle
              size={10}
              style={{
                color: isPaused ? 'var(--semantic-amber)' : 'var(--semantic-recording)',
                fill: isPaused ? 'var(--semantic-amber)' : 'var(--semantic-recording)',
                animation: isPaused ? 'none' : 'pulse-dot 1.2s infinite',
              }}
            />
            <span
              style={{
                fontWeight: 700,
                fontSize: '0.82rem',
                letterSpacing: '0.06em',
                color: isPaused ? 'var(--semantic-amber)' : 'var(--semantic-recording)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {isPaused ? 'PAUSED' : '● LIVE RECORDING'}
            </span>
          </div>

          <div style={{ width: 1, height: 16, background: 'var(--border-subtle)' }} />

          {/* Time & Counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              className="mono"
              style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}
            >
              {formatTime(elapsed)}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border-default)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.74rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              <Terminal size={11} style={{ color: 'var(--semantic-auth)' }} />
              {recording.actionCount} ACTION{recording.actionCount === 1 ? '' : 'S'}
            </span>
          </div>

          <div style={{ width: 1, height: 16, background: 'var(--border-subtle)' }} />

          {/* Task Description */}
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {recording.taskDescription}
          </span>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isPaused ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onResume}
              style={{ gap: 5 }}
            >
              <Play size={12} /> Resume
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onPause}
              style={{ gap: 5 }}
            >
              <Pause size={12} /> Pause
            </button>
          )}

          <button
            type="button"
            className="btn btn-accent btn-sm"
            onClick={onComplete}
            style={{
              gap: 5,
              background: 'var(--semantic-emerald)',
              borderColor: 'var(--semantic-emerald)',
            }}
          >
            <CheckCircle size={12} /> Complete & Save
          </button>

          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={onDiscard}
            style={{ gap: 5 }}
          >
            <Trash2 size={12} /> Discard
          </button>
        </div>
      </div>

      {/* Live Semantic Trace Breadcrumb Feed */}
      {recording.actionTrace && recording.actionTrace.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            overflowX: 'auto',
            paddingTop: 4,
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <span
            style={{
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-muted)',
              fontWeight: 700,
            }}
          >
            Trace:
          </span>
          {recording.actionTrace.map((act, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--surface-2)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-xs)',
                padding: '2px 8px',
                fontSize: '0.74rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                animation: 'drawer-fade-in 200ms ease-out',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>0{index + 1}</span>
              <span style={{ color: 'var(--semantic-auth)', fontWeight: 600 }}>
                {act.actionType}
              </span>
              {act.summary && (
                <span style={{ color: 'var(--text-secondary)' }}>({act.summary})</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
