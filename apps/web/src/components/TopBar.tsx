import React, { useEffect, useState } from 'react';
import { Search, Shield, Cpu, Lock, User, Terminal } from 'lucide-react';
import { detectWebMCPSupport } from '@deputy/webmcp';
import { ActiveRecordingState } from './RecordingBar.js';

interface TopBarProps {
  onOpenCommandPalette: () => void;
  recording: ActiveRecordingState | null;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenCommandPalette, recording }) => {
  const [serverOnline, setServerOnline] = useState(true);
  const [webmcpAvailable, setWebmcpAvailable] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        setServerOnline(res.ok);
      } catch {
        setServerOnline(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const caps = detectWebMCPSupport();
    setWebmcpAvailable(caps.available);
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
            minWidth: 260,
            justifyContent: 'space-between',
          }}
          title="Open Command Palette (⌘K or Ctrl+K)"
        >
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}
          >
            <Search size={13} />
            <span style={{ fontSize: '0.8rem' }}>Type a command or search...</span>
          </div>
          <span className="command-palette-kbd">⌘K</span>
        </button>

        {/* Workspace context */}
        <div
          className="mono"
          style={{
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            paddingLeft: 8,
            borderLeft: '1px solid var(--border-subtle)',
          }}
        >
          <Terminal size={12} />
          <span>PROD_GATEWAY_NODE_01</span>
        </div>
      </div>

      {/* Right: Technical Status Hierarchy */}
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
              border: '1px solid rgba(244, 63, 94, 0.35)',
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

        {/* 1. Security Gate Integrity */}
        <div
          className="system-status-indicator"
          title="Invariant 3 & 8: Fail-closed gateway policy active"
        >
          <Shield size={12} style={{ color: 'var(--semantic-emerald)' }} />
          <span
            style={{
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
            }}
          >
            GATE: <strong style={{ color: 'var(--semantic-emerald)' }}>FAIL-CLOSED</strong>
          </span>
        </div>

        {/* 2. WebMCP Execution Capability */}
        <div className="system-status-indicator" title="WebMCP Model Context Provider">
          <Cpu size={12} style={{ color: 'var(--semantic-webmcp)' }} />
          <span
            style={{
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
            }}
          >
            WEBMCP:{' '}
            <strong style={{ color: 'var(--semantic-webmcp)' }}>
              {webmcpAvailable ? 'NATIVE' : 'EMULATED'}
            </strong>
          </span>
        </div>

        {/* 3. Hash-Chain Integrity */}
        <div className="system-status-indicator" title="Cryptographic append-only ledger">
          <Lock size={12} style={{ color: 'var(--semantic-audit)' }} />
          <span
            style={{
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
            }}
          >
            CHAIN: <strong style={{ color: 'var(--semantic-audit)' }}>SHA-256</strong>
          </span>
        </div>

        {/* 4. Operator & Server Online Indicator */}
        <div
          className="system-status-indicator"
          style={{ background: 'var(--surface-3)', borderColor: 'var(--border-default)' }}
          title="Authenticated Operator Context"
        >
          <User size={12} style={{ color: 'var(--semantic-auth)' }} />
          <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-primary)' }}>
            usr_ops_lead
          </span>
          <span
            className={`status-dot ${serverOnline ? 'active' : 'danger'}`}
            style={{ marginLeft: 4 }}
          />
        </div>
      </div>
    </header>
  );
};
