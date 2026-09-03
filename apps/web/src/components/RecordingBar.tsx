import React, { useEffect, useState } from 'react';
import { Circle, Pause, Play, CheckCircle, Trash2, Video } from 'lucide-react';

export interface ActiveRecordingState {
  demonstrationId: string;
  sessionId: string;
  taskDescription: string;
  status: 'RECORDING' | 'PAUSED';
  startedAt: number;
  actionCount: number;
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
  const [taskInput, setTaskInput] = useState('');
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
      setTaskInput('');
    } finally {
      setLoading(false);
    }
  };

  if (!recording) {
    return (
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '10px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#64748b' }} />
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Demonstration Recorder is idle. Demonstrate a task in Operations Console to teach
            DEPUTY.
          </span>
        </div>

        <button
          className="btn btn-primary"
          style={{ padding: '6px 14px', fontSize: '0.82rem', gap: '6px' }}
          onClick={() => setShowModal(true)}
        >
          <Video size={14} /> Start Demonstration
        </button>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: '440px' }}>
              <div className="modal-header">
                <h3>Start New Demonstration</h3>
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                  onClick={() => setShowModal(false)}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleStartSubmit}>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '14px' }}>
                  Demonstrate a task by performing real operations. DEPUTY will capture the semantic
                  trace without scraping the DOM.
                </p>
                <div className="form-group">
                  <label className="form-label">Task Description</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Create customer and bill initial invoice"
                    value={taskInput}
                    onChange={e => setTaskInput(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '10px',
                    marginTop: '16px',
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Starting...' : 'Begin Recording'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  const isPaused = recording.status === 'PAUSED';

  return (
    <div
      style={{
        background: isPaused ? 'rgba(120, 53, 15, 0.4)' : 'rgba(69, 10, 10, 0.4)',
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${isPaused ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
        padding: '10px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: isPaused
          ? '0 4px 20px rgba(245, 158, 11, 0.1)'
          : '0 4px 20px rgba(239, 68, 68, 0.15)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Circle
            size={12}
            style={{
              color: isPaused ? '#f59e0b' : '#ef4444',
              fill: isPaused ? '#f59e0b' : '#ef4444',
              animation: isPaused ? 'none' : 'pulse 1.5s infinite',
            }}
          />
          <span
            style={{
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '0.05em',
              color: isPaused ? '#f59e0b' : '#ef4444',
            }}
          >
            {isPaused ? 'PAUSED' : 'RECORDING'}
          </span>
        </div>

        <div style={{ height: '16px', width: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />

        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
            {recording.taskDescription}
          </span>
          <span
            className="mono"
            style={{ fontSize: '0.78rem', color: '#94a3b8', marginLeft: '10px' }}
          >
            ⏱ {formatTime(elapsed)} | {recording.actionCount} action(s)
          </span>
        </div>

        {recording.lastAction && (
          <div
            className="mono"
            style={{
              fontSize: '0.75rem',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '2px 8px',
              borderRadius: '4px',
              color: '#38bdf8',
            }}
          >
            Latest: {recording.lastAction.actionType} ({recording.lastAction.summary})
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        {isPaused ? (
          <button
            className="btn btn-secondary"
            style={{ padding: '5px 10px', fontSize: '0.78rem', gap: '4px' }}
            onClick={onResume}
          >
            <Play size={12} /> Resume
          </button>
        ) : (
          <button
            className="btn btn-secondary"
            style={{ padding: '5px 10px', fontSize: '0.78rem', gap: '4px' }}
            onClick={onPause}
          >
            <Pause size={12} /> Pause
          </button>
        )}

        <button
          className="btn btn-primary"
          style={{
            padding: '5px 12px',
            fontSize: '0.78rem',
            gap: '4px',
            background: 'var(--success)',
          }}
          onClick={onComplete}
        >
          <CheckCircle size={12} /> Finish Demonstration
        </button>

        <button
          className="btn btn-secondary"
          style={{ padding: '5px 10px', fontSize: '0.78rem', gap: '4px', color: '#ef4444' }}
          onClick={onDiscard}
        >
          <Trash2 size={12} /> Discard
        </button>
      </div>
    </div>
  );
};
