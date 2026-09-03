import React from 'react';

export type BadgeVariant =
  | 'active'
  | 'draft'
  | 'retired'
  | 'disabled'
  | 'reversible'
  | 'compensatable'
  | 'irreversible'
  | 'risk-low'
  | 'risk-medium'
  | 'risk-high'
  | 'risk-critical'
  | 'auth'
  | 'webmcp'
  | 'neutral';

export interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({ variant, children, icon, className = '', style }) => {
  return (
    <span className={`badge badge-${variant} ${className}`} style={style}>
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </span>
  );
};
