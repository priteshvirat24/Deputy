import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <div className="empty-state">
      {icon && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-1)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            marginBottom: '8px',
          }}
        >
          {icon}
        </div>
      )}
      <div className="empty-state-title">{title}</div>
      <div className="empty-state-desc">{description}</div>
      {action && <div style={{ marginTop: '16px' }}>{action}</div>}
    </div>
  );
};
