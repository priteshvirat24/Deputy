import React from 'react';

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  level?: 1 | 2 | 3 | 4;
  headerTitle?: string;
  headerAction?: React.ReactNode;
  headerMeta?: React.ReactNode;
  noPadding?: boolean;
}

export const Surface: React.FC<SurfaceProps> = ({
  level = 2,
  headerTitle,
  headerAction,
  headerMeta,
  noPadding = false,
  className = '',
  style = {},
  children,
  ...props
}) => {
  const surfaceStyle: React.CSSProperties = {
    background: `var(--surface-${level})`,
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    ...style,
  };

  return (
    <div style={surfaceStyle} className={`panel ${className}`} {...props}>
      {headerTitle && (
        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="panel-title">{headerTitle}</span>
            {headerMeta && (
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{headerMeta}</span>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div style={noPadding ? { padding: 0 } : { padding: '18px 20px' }}>{children}</div>
    </div>
  );
};
