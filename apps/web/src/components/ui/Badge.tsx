import React from 'react';

export type BadgeVariant =
  | 'active'
  | 'draft'
  | 'retired'
  | 'reversible'
  | 'compensatable'
  | 'irreversible'
  | 'risk-low'
  | 'risk-medium'
  | 'risk-high'
  | 'risk-critical'
  | 'auth'
  | 'neutral';

export interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant, children, icon, className = '' }) => {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </span>
  );
};
