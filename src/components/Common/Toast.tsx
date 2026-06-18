import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  exiting?: boolean;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const icons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const iconColors: Record<ToastType, string> = {
  success: 'var(--color-success)',
  error: 'var(--color-danger)',
  warning: 'var(--color-warning)',
  info: 'var(--color-primary)',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = `toast-${++counterRef.current}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), 4000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type} ${toast.exiting ? 'toast-exit' : ''}`}
          >
            <span
              className="toast-icon"
              style={{ color: iconColors[toast.type], fontWeight: 700 }}
            >
              {icons[toast.type]}
            </span>
            <span className="toast-message">{toast.message}</span>
            <button
              className="toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
