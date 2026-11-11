import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismissToast(id), 4500);
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2"
      >
        {toasts.map((toast) => {
          const styles =
            toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : toast.type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-900'
                : 'border-indigo-200 bg-indigo-50 text-indigo-900';

          const Icon =
            toast.type === 'success'
              ? CheckCircle2
              : toast.type === 'error'
                ? AlertCircle
                : Info;

          return (
            <div
              key={toast.id}
              role="status"
              className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lg ${styles}`}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1">{toast.message}</span>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismissToast(toast.id)}
                className="rounded p-0.5 hover:bg-black/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

