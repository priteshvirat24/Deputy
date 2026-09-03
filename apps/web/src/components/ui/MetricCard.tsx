import React from 'react';

export interface MetricCardProps {
  label: string;
  value: number | string;
  hint?: string;
  icon?: React.ReactNode;
  statusColor?: 'emerald' | 'amber' | 'danger' | 'auth' | 'webmcp' | 'audit';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  hint,
  icon,
  statusColor,
}) => {
  const getDotClass = () => {
    switch (statusColor) {
      case 'emerald':
        return 'active';
      case 'amber':
        return 'amber';
      case 'danger':
        return 'danger';
      default:
        return '';
    }
  };

  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {statusColor && <span className={`status-dot ${getDotClass()}`} />}
          {icon && <span style={{ color: 'var(--text-muted)' }}>{icon}</span>}
        </div>
      </div>
      <div className="stat-value">{value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
};
