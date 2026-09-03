import React from 'react';

export const SettingsView: React.FC = () => {
  return (
    <div className="page-body">
      <div className="page-header">
        <h2 className="page-title">System Settings & Runtime Configuration</h2>
        <p className="page-description">
          Active operational parameters, security limits, and WebMCP protocol configuration.
        </p>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Runtime Environment</h3>
        </div>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '12px',
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>Backend API Gateway</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Hono + Node.js HTTP Server
              </div>
            </div>
            <div className="mono" style={{ color: 'var(--accent-cyan)' }}>
              http://127.0.0.1:4000
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '12px',
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>Primary Database Engine</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                PostgreSQL via Drizzle ORM
              </div>
            </div>
            <div className="mono" style={{ color: '#34d399' }}>
              PostgreSQL 18 Target
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '12px',
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>WebMCP Protocol Specification</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Targeted browser capability surface
              </div>
            </div>
            <div className="mono" style={{ color: '#f59e0b' }}>
              draft-2025-01
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '12px',
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>Authorization TTL Window</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Maximum validity for issued human authorizations
              </div>
            </div>
            <div className="mono">300 seconds (5 minutes)</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Execution Policy Default</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Default security stance for unmatched policies
              </div>
            </div>
            <div className="mono" style={{ color: '#38bdf8', fontWeight: 700 }}>
              FAIL-CLOSED (DENY)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
