import React from 'react';
import { ProvenanceRecord, TrustClass } from '@deputy/domain';
import { Shield, ShieldAlert, Cpu, User, Globe, HelpCircle } from 'lucide-react';

interface ProvenanceBadgeProps {
  trustClass?: TrustClass | string;
  source?: string;
  origin?: string;
  contentId?: string;
  compact?: boolean;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  trustClass = 'UNKNOWN',
  source,
  origin,
  compact = false,
}) => {
  const normClass = String(trustClass).toUpperCase();

  let className = 'trust-badge trust-badge-unknown';
  let icon = <HelpCircle size={11} />;
  let label = 'UNKNOWN';

  switch (normClass) {
    case 'FIRST_PARTY':
      className = 'trust-badge trust-badge-first-party';
      icon = <Shield size={11} />;
      label = 'FIRST-PARTY';
      break;
    case 'USER_GENERATED':
      className = 'trust-badge trust-badge-user-gen';
      icon = <User size={11} />;
      label = 'USER-GEN';
      break;
    case 'THIRD_PARTY':
      className = 'trust-badge trust-badge-third-party';
      icon = <Globe size={11} />;
      label = 'THIRD-PARTY';
      break;
    case 'EXTERNAL':
      className = 'trust-badge trust-badge-external';
      icon = <ShieldAlert size={11} />;
      label = 'EXTERNAL (UNTRUSTED)';
      break;
    case 'SYSTEM_GENERATED':
      className = 'trust-badge trust-badge-system-gen';
      icon = <Cpu size={11} />;
      label = 'SYSTEM-GEN';
      break;
    default:
      className = 'trust-badge trust-badge-unknown';
      icon = <HelpCircle size={11} />;
      label = normClass || 'UNKNOWN';
  }

  if (compact) {
    return (
      <span className={className} title={`Source: ${source || 'N/A'} · Origin: ${origin || 'N/A'}`}>
        {icon}
        <span>{label}</span>
      </span>
    );
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span className={className}>
        {icon}
        <span>{label}</span>
      </span>
      {source && (
        <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          [{source}]
        </span>
      )}
    </div>
  );
};

export const ProvenanceCard: React.FC<{ provenance?: ProvenanceRecord; title?: string }> = ({
  provenance,
  title = 'Data Provenance & Trust Boundary',
}) => {
  if (!provenance) {
    return (
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        No provenance metadata attached.
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        padding: '12px 14px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-muted)',
            fontWeight: 700,
          }}
        >
          {title}
        </span>
        <ProvenanceBadge trustClass={provenance.trustClass} compact />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 8,
          fontSize: '0.78rem',
        }}
      >
        <div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Source: </span>
          <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
            {provenance.source}
          </span>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Origin: </span>
          <span className="mono" style={{ color: 'var(--semantic-emerald)', fontWeight: 500 }}>
            {provenance.origin}
          </span>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Content ID: </span>
          <span className="mono" style={{ color: 'var(--text-secondary)' }}>
            {provenance.contentId || 'N/A'}
          </span>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Retrieved: </span>
          <span className="mono" style={{ color: 'var(--text-muted)' }}>
            {provenance.retrievedAt ? new Date(provenance.retrievedAt).toLocaleTimeString() : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};
