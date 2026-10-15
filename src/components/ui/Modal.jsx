import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import Button from './Button.jsx';
import { cn } from '../../utils/format.js';

/** Accessible modal: Escape closes, focus moves inside and is restored, Tab is trapped. */
export default function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  const panel = useRef(null);
  const lastFocus = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => {
      const el = panel.current?.querySelector('input,select,textarea,button:not([data-close])') ?? panel.current;
      el?.focus();
    }, 30);
    const onKey = (e) => {
      if (e.key === 'Escape') closeRef.current();
      if (e.key === 'Tab' && panel.current) {
        const f = panel.current.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
      lastFocus.current?.focus?.();
    };
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabIndex={-1}
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={cn(
              'relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-ink-800 shadow-2xl sm:rounded-2xl',
              { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' }[size]
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/5 px-5 py-4 sm:px-6">
              <div>
                <h2 id="modal-title" className="text-lg font-semibold">
                  {title}
                </h2>
                {description && <p className="mt-1 text-sm text-mist-400">{description}</p>}
              </div>
              <button data-close onClick={onClose} className="rounded-lg p-1.5 text-mist-400 hover:bg-white/5 hover:text-mist-100" aria-label="Close dialog">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="scrollbar-thin overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
            {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-white/5 bg-ink-850/60 px-5 py-4 sm:px-6">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', tone = 'danger', loading }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tone === 'danger' ? 'bg-danger/10 text-danger' : 'bg-lime/10 text-lime')}>
          <AlertTriangle className="h-5 w-5" aria-hidden />
        </div>
        <p className="text-sm leading-relaxed text-mist-300">{message}</p>
      </div>
    </Modal>
  );
}
