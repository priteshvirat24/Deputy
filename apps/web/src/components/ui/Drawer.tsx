import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface DrawerTab {
  id: string;
  label: string;
}

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  headerBadge?: React.ReactNode;
  tabs?: DrawerTab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
  width?: string | number;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  headerBadge,
  tabs,
  activeTab,
  onTabChange,
  footer,
  children,
  width,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="drawer-backdrop"
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div className="drawer-panel" ref={panelRef} style={width ? { width } : undefined}>
        <div className="drawer-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 id="drawer-title" className="drawer-title">
                {title}
              </h2>
              {headerBadge}
            </div>
            {subtitle && <div className="drawer-subtitle">{subtitle}</div>}
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            aria-label="Close drawer"
            style={{ padding: '4px 8px' }}
          >
            <X size={15} />
          </button>
        </div>

        {tabs && tabs.length > 0 && (
          <div className="drawer-tabs">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`drawer-tab ${isActive ? 'active' : ''}`}
                  onClick={() => onTabChange && onTabChange(tab.id)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="drawer-body">{children}</div>

        {footer && <div className="drawer-footer">{footer}</div>}
      </div>
    </div>
  );
};
