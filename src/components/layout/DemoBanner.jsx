import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FlaskConical, X, RotateCcw } from 'lucide-react';
import { isDemoMode, api } from '../../services/api.js';
import { consumeRefreshedFlag } from '../../services/demoStore.js';
import { useData } from '../../context/DataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../ui/Button.jsx';
import { ConfirmDialog } from '../ui/Modal.jsx';

/** Persistent, honest indicator that the app is running on browser-only demo data. */
export default function DemoBanner() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const { refresh, loading } = useData();
  const toast = useToast();
  const { signOut } = useAuth();

  useEffect(() => {
    if (isDemoMode && !loading && consumeRefreshedFlag()) toast.info('Demo data was refreshed so tournament dates stay current.');
  }, [loading, toast]);

  if (!isDemoMode) return null;

  const reset = async () => {
    setBusy(true);
    await api.resetDemo();
    await signOut();
    await refresh();
    setBusy(false);
    setConfirm(false);
    setOpen(false);
    toast.success('Demo data has been reset.');
  };

  return (
    <div className="fixed bottom-4 left-4 z-[60] max-w-[calc(100vw-2rem)]">
      <AnimatePresence mode="wait">
        {open ? (
          <motion.div key="panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="w-80 max-w-full rounded-2xl border border-warn/30 bg-ink-800/95 p-4 shadow-2xl backdrop-blur">
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-2 font-display text-sm font-semibold text-warn">
                <FlaskConical className="h-4 w-4" /> Demo mode
              </p>
              <button onClick={() => setOpen(false)} className="rounded p-1 text-mist-400 hover:text-mist-100" aria-label="Close demo info">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs leading-relaxed text-mist-300">
              Supabase is not configured. All teams, players and results are <strong className="text-mist-100">fictional demo data</strong>. Anything you create or change is saved only in this browser — nothing is sent to a server.
            </p>
            <p className="mt-2 text-xs text-mist-500">Add credentials to <code className="text-mist-300">.env.local</code> to use the real database (see README).</p>
            <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={() => setConfirm(true)}>
              <RotateCcw className="h-4 w-4" /> Reset demo data
            </Button>
          </motion.div>
        ) : (
          <motion.button key="pill" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-full border border-warn/40 bg-ink-800/90 px-3.5 py-2 font-mono text-[11px] uppercase tracking-wider text-warn shadow-lg backdrop-blur hover:bg-ink-750">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-warn" aria-hidden />
            Demo data
          </motion.button>
        )}
      </AnimatePresence>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={reset} loading={busy} title="Reset demo data?" message="This restores the original demo tournaments, teams and results and signs out any demo account. Changes you made in this browser will be lost." confirmLabel="Reset" />
    </div>
  );
}
