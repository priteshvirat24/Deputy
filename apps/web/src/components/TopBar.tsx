import React, { useEffect, useState } from 'react';
import { ShieldCheck, Cpu, Database, User } from 'lucide-react';
import { detectWebMCPSupport } from '@deputy/webmcp';

export const TopBar: React.FC = () => {
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const [webmcpAvailable, setWebmcpAvailable] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check native WebMCP availability
    const caps = detectWebMCPSupport();
    setWebmcpAvailable(caps.available);

    // 2. Query real health endpoint
    const checkHealth = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/health');
        if (res.ok) {
          const json = await res.json();
          setBackendHealthy(json.status === 'healthy' || json.status === 'ok');
        } else {
          setBackendHealthy(false);
        }
      } catch {
        setBackendHealthy(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="top-command-bar" role="banner">
      <div className="top-bar-left">
        {/* Workspace Scope */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.82rem',
            fontWeight: 600,
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>Workspace:</span>
          <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            deputy.primary
          </span>
        </div>

        <div style={{ width: 1, height: 16, background: 'var(--border-subtle)' }} />

        {/* Backend Connectivity Probe */}
        <div className="system-status-indicator" title="Live status from GET /api/health">
          <span
            className={`status-dot ${backendHealthy === true ? 'active' : backendHealthy === false ? 'danger' : 'amber'}`}
          />
          <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}>
            API{' '}
            {backendHealthy === true
              ? 'OPERATIONAL'
              : backendHealthy === false
                ? 'OFFLINE'
                : 'PROBING...'}
          </span>
        </div>

        {/* WebMCP Runtime State */}
        <div
          className="system-status-indicator"
          title={
            webmcpAvailable ? 'Native modelContext detected' : 'Emulated WebMCP adapter active'
          }
        >
          <Cpu size={13} style={{ color: 'var(--semantic-webmcp)' }} />
          <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}>
            WebMCP {webmcpAvailable ? 'NATIVE' : 'EMULATED'}
          </span>
        </div>

        {/* Security Gate Mode */}
        <div
          className="system-status-indicator"
          title="Fail-Closed ActionRegistry Gate & FIDO2 WebAuthn UV"
        >
          <ShieldCheck size={13} style={{ color: 'var(--semantic-auth)' }} />
          <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}>
            GATE: WEBAUTHN UV
          </span>
        </div>
      </div>

      <div className="top-bar-right">
        {/* Audit Hash-Chain Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
          }}
        >
          <Database size={13} style={{ color: 'var(--semantic-audit)' }} />
          <span style={{ fontFamily: 'var(--font-mono)' }}>SHA-256 CHAIN: ACTIVE</span>
        </div>

        <div style={{ width: 1, height: 16, background: 'var(--border-subtle)' }} />

        {/* Operator Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 'var(--radius-xs)',
              background: 'var(--surface-3)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            <User size={13} />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
            }}
          >
            admin_usr_01
          </span>
        </div>
      </div>
    </header>
  );
};
