import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cx } from '../utils/format';

const ToastContext = createContext(null);

const ICONS = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
  error: <AlertCircle className="h-5 w-5 text-red-600" />,
  info: <Info className="h-5 w-5 text-ink-700" />,
};

/** Lightweight toast notifications (mobile-friendly, auto dismiss). */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (message, type = 'info', ttl = 3500) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((t) => [...t.slice(-2), { id, message, type }]);
      setTimeout(() => remove(id), ttl);
    },
    [remove]
  );

  const value = useMemo(
    () => ({
      push,
      success: (m) => push(m, 'success'),
      error: (m) => push(m, 'error', 5000),
      info: (m) => push(m, 'info'),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[80] flex flex-col items-center gap-2 px-3 sm:top-5">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cx(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-white/95 px-4 py-3 text-sm shadow-pop backdrop-blur animate-fadeUp',
              t.type === 'error' ? 'border-red-200' : 'border-ink-100'
            )}
          >
            <span className="mt-0.5 shrink-0">{ICONS[t.type] || ICONS.info}</span>
            <p className="flex-1 text-ink-800">{t.message}</p>
            <button onClick={() => remove(t.id)} aria-label="Dismiss" className="text-ink-300 hover:text-ink-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};
