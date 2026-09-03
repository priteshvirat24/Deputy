import React from 'react';
import { Surface } from '../components/ui/Surface.js';
import { Badge } from '../components/ui/Badge.js';

export const SettingsView: React.FC = () => {
  return (
    <div className="page-body">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span
            style={{
              fontSize: '0.72rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              fontWeight: 700,
            }}
          >
            SYSTEM CONFIGURATION
          </span>
          <span style={{ color: 'var(--border-strong)' }}>/</span>
          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            RUNTIME PARAMETERS
          </span>
        </div>
        <h1 className="page-title">System Settings & Runtime Configuration</h1>
        <p className="page-description">
          Active operational parameters, security limits, database engine, and WebMCP protocol
          configuration.
        </p>
      </div>

      <Surface
        level={2}
        headerTitle="Runtime Environment & Security Boundaries"
        headerMeta="OPERATING CONFIGURATION"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '12px',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                Backend API Gateway
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Hono + Node.js HTTP Server
              </div>
            </div>
            <span className="mono" style={{ color: 'var(--semantic-webmcp)', fontSize: '0.82rem' }}>
              {`${window.location.origin}/api`}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '12px',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                Primary Database Engine
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                PostgreSQL via Drizzle ORM
              </div>
            </div>
            <span
              className="mono"
              style={{ color: 'var(--semantic-emerald)', fontSize: '0.82rem' }}
            >
              PostgreSQL 18 Target
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '12px',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                WebMCP Protocol Specification
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Targeted browser model capability surface
              </div>
            </div>
            <Badge variant="webmcp">draft-2025-01</Badge>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '12px',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                Authorization TTL Window
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Maximum validity for issued human authorizations
              </div>
            </div>
            <span className="mono" style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
              300 seconds (5 minutes)
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                Execution Policy Default
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Default security stance for unmatched capability policies
              </div>
            </div>
            <Badge variant="risk-critical">FAIL-CLOSED (DENY)</Badge>
          </div>
        </div>
      </Surface>
    </div>
  );
};
