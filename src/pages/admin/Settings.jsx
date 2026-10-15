import { useState } from 'react';
import { Database, ShieldCheck, RotateCcw, Clock, Calculator } from 'lucide-react';
import { AdminHeader } from '../../layouts/AdminLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/index.js';
import { api, isDemoMode } from '../../services/api.js';
import { DEFAULT_SCORING, TIMEZONE } from '../../lib/constants.js';
import { describeRules, CIRCUIT_DESCRIPTION } from '../../utils/scoring.js';
import { useNavigate } from 'react-router-dom';

export default function AdminSettings() {
  useDocumentTitle('Admin · Settings');
  const { refresh } = useData();
  const { signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = async () => {
    setBusy(true);
    await api.resetDemo();
    await signOut();
    await refresh();
    toast.success('Demo data reset.');
    navigate('/login');
  };

  return (
    <>
      <AdminHeader title="Settings" description="Platform configuration and environment status." />
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="surface p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold uppercase"><Database className="h-5 w-5 text-lime" /> Data backend</h2>
          <div className="mt-3">{isDemoMode ? <Badge tone="warn" dot>Demo mode</Badge> : <Badge tone="lime" dot>Supabase connected</Badge>}</div>
          <p className="mt-3 text-sm text-mist-300">
            {isDemoMode
              ? 'No Supabase credentials found. All data is fictional demo data stored in this browser only. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local and restart to use the real database.'
              : 'Reads and writes go to your Supabase project. Permissions are enforced by row-level security and database functions.'}
          </p>
          {isDemoMode && (
            <Button variant="danger" size="sm" className="mt-4" onClick={() => setConfirm(true)}>
              <RotateCcw className="h-4 w-4" /> Reset demo data
            </Button>
          )}
        </section>
        <section className="surface p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold uppercase"><ShieldCheck className="h-5 w-5 text-lime" /> Security model</h2>
          <ul className="mt-3 space-y-2 text-sm text-mist-300">
            <li>• Admin role is stored in <code className="text-mist-100">profiles.role</code> and can only be changed by another admin (or in the Supabase SQL editor).</li>
            <li>• Every admin write is checked in Postgres by <code className="text-mist-100">is_admin()</code>; hiding links in the UI is not relied upon.</li>
            <li>• Registrations go through <code className="text-mist-100">register_team()</code>, which locks the tournament row to enforce capacity, deadlines and team size atomically.</li>
            <li>• The browser only ever uses the public anon key.</li>
          </ul>
        </section>
        <section className="surface p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold uppercase"><Calculator className="h-5 w-5 text-lime" /> Default scoring</h2>
          <dl className="mt-3 space-y-3 text-sm">
            <div><dt className="text-mist-500">Valorant & Mini Militia</dt><dd className="text-mist-200">{describeRules(DEFAULT_SCORING.h2h)}</dd></div>
            <div><dt className="text-mist-500">BGMI & Free Fire</dt><dd className="text-mist-200">{describeRules(DEFAULT_SCORING.br)}</dd></div>
            <div><dt className="text-mist-500">Overall rankings</dt><dd className="text-mist-200">{CIRCUIT_DESCRIPTION}</dd></div>
          </dl>
          <p className="mt-3 text-xs text-mist-500">Override per tournament in the tournament editor.</p>
        </section>
        <section className="surface p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold uppercase"><Clock className="h-5 w-5 text-lime" /> Timezone</h2>
          <p className="mt-3 text-sm text-mist-300">All dates are entered and displayed in <strong className="text-mist-100">{TIMEZONE} (IST, UTC+5:30)</strong> and stored as UTC timestamps.</p>
        </section>
      </div>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={reset} loading={busy} title="Reset demo data?" message="Restores the original demo dataset and signs you out. Changes made in this browser will be lost." confirmLabel="Reset" />
    </>
  );
}
