import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = { success: CheckCircle2, error: AlertTriangle, info: Info };
const TONES = {
  success: 'border-lime/40 text-lime',
  error: 'border-danger/50 text-danger',
  info: 'border-cyan/40 text-cyan',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (type, message, title) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t.slice(-3), { id, type, message, title }]);
      setTimeout(() => dismiss(id), type === 'error' ? 6000 : 4000);
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      success: (m, t) => push('success', m, t),
      error: (m, t) => push('error', m, t),
      info: (m, t) => push('info', m, t),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end" aria-live="polite" role="status">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const Icon = ICONS[t.type];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-ink-800/95 p-4 shadow-card backdrop-blur ${TONES[t.type]}`}
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                <div className="min-w-0 flex-1">
                  {t.title && <p className="font-display text-sm font-semibold text-mist-100">{t.title}</p>}
                  <p className="text-sm text-mist-200">{t.message}</p>
                </div>
                <button onClick={() => dismiss(t.id)} className="rounded p-1 text-mist-400 hover:text-mist-100" aria-label="Dismiss notification">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
