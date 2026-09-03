import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { ActiveRecordingState } from './RecordingBar.js';

interface TopBarProps {
  onOpenCommandPalette: () => void;
  recording: ActiveRecordingState | null;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenCommandPalette, recording }) => {
  const [serverOnline, setServerOnline] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/health');
        setServerOnline(res.ok);
      } catch {
        setServerOnline(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="top-command-bar">
      {/* Left: Global Command Palette Trigger */}
      <div className="top-bar-left">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onOpenCommandPalette}
          style={{
            background: 'var(--surface-2)',
            borderColor: 'var(--border-subtle)',
            gap: 10,
            padding: '5px 12px',
            borderRadius: 'var(--radius-sm)',
            minWidth: 240,
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}
          >
            <Search size={13} />
            <span style={{ fontSize: '0.8rem' }}>Type a command or search...</span>
          </div>
          <span className="command-palette-kbd">⌘K</span>
        </button>
      </div>

      {/* Right: Runtime Diagnostics */}
      <div className="top-bar-right">
        {/* Active Recording Notice if any */}
        {recording && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 8px',
              borderRadius: 'var(--radius-xs)',
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: 'var(--semantic-recording)',
              fontWeight: 700,
            }}
          >
            <span className="status-dot recording" />
            <span>RECORDING: {recording.actionCount} ACTIONS</span>
          </div>
        )}

        {/* Server & Security Status Indicator */}
        <div className="system-status-indicator">
          <span className={`status-dot ${serverOnline ? 'active' : 'danger'}`} />
          <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}>
            {serverOnline ? 'SECURE GATEWAY: ONLINE' : 'GATEWAY: OFFLINE'}
          </span>
        </div>
      </div>
    </header>
  );
};
