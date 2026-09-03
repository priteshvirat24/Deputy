import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Key, Info, X } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'error' | 'amber' | 'auth';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  durationMs?: number;
}

interface ToastContextValue {
  showToast: (type: ToastType, title: string, message?: string, durationMs?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, title: string, message?: string, durationMs = 4000) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setToasts(prev => [...prev, { id, type, title, message, durationMs }]);

      if (durationMs > 0) {
        setTimeout(() => {
          removeToast(id);
        }, durationMs);
      }
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map(toast => {
          const icon =
            toast.type === 'success' ? (
              <CheckCircle2
                size={16}
                style={{ color: 'var(--semantic-emerald)', flexShrink: 0, marginTop: 2 }}
              />
            ) : toast.type === 'error' ? (
              <AlertCircle
                size={16}
                style={{ color: 'var(--semantic-danger)', flexShrink: 0, marginTop: 2 }}
              />
            ) : toast.type === 'auth' ? (
              <Key
                size={16}
                style={{ color: 'var(--semantic-auth)', flexShrink: 0, marginTop: 2 }}
              />
            ) : toast.type === 'info' ? (
              <Info
                size={16}
                style={{ color: 'var(--semantic-webmcp)', flexShrink: 0, marginTop: 2 }}
              />
            ) : (
              <AlertTriangle
                size={16}
                style={{ color: 'var(--semantic-amber)', flexShrink: 0, marginTop: 2 }}
              />
            );

          return (
            <div key={toast.id} className={`toast-item ${toast.type}`}>
              {icon}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="toast-title">{toast.title}</div>
                {toast.message && <div className="toast-message">{toast.message}</div>}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 2,
                }}
                aria-label="Close notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};
