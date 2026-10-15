import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, X, ClipboardList } from 'lucide-react';
import { AdminHeader } from '../../layouts/AdminLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import Tabs from '../../components/ui/Tabs.jsx';
import { Select } from '../../components/ui/Field.jsx';
import { RegStatusBadge } from '../../components/ui/Badge.jsx';
import { TeamLogo } from '../../components/ui/Avatar.jsx';
import { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { EmptyState, RowSkeleton } from '../../components/ui/States.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/index.js';
import { byId, teamMembers } from '../../utils/selectors.js';
import { rosterLimits } from '../../utils/registrationRules.js';
import { formatDateTime } from '../../utils/format.js';

export default function AdminRegistrations() {
  useDocumentTitle('Admin · Registrations');
  const { userId } = useAuth();
  const { db, loading, run } = useData();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? 'pending';
  const [tournamentId, setTournamentId] = useState('');
  const [busy, setBusy] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const counts = Object.fromEntries(['pending', 'approved', 'rejected', 'withdrawn'].map((s) => [s, db.registrations.filter((r) => r.status === s).length]));
  const list = db.registrations
    .filter((r) => status === 'all' || r.status === status)
    .filter((r) => !tournamentId || r.tournamentId === tournamentId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const setReg = async (r, next) => {
    setBusy(r.id + next);
    try {
      await run((api) => api.setRegistrationStatus(userId, r.id, next));
      toast.success(`Registration ${next}.`);
      setConfirm(null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <AdminHeader title="Registrations" description="Review team registrations. Approval enforces the tournament’s capacity." />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          value={status}
          onChange={(v) => setParams(v === 'pending' ? {} : { status: v }, { replace: true })}
          ariaLabel="Registration status"
          options={[
            { value: 'pending', label: 'Pending', count: counts.pending },
            { value: 'approved', label: 'Approved', count: counts.approved },
            { value: 'rejected', label: 'Rejected', count: counts.rejected },
            { value: 'withdrawn', label: 'Withdrawn', count: counts.withdrawn },
            { value: 'all', label: 'All' },
          ]}
        />
        <Select aria-label="Filter by tournament" value={tournamentId} onChange={(e) => setTournamentId(e.target.value)} options={[{ value: '', label: 'All tournaments' }, ...db.tournaments.map((t) => ({ value: t.id, label: t.name }))]} className="lg:w-72" />
      </div>
      {loading ? (
        <RowSkeleton />
      ) : list.length === 0 ? (
        <EmptyState icon={ClipboardList} title={status === 'pending' ? 'Nothing to review' : 'No registrations'} message={status === 'pending' ? 'All caught up — new requests will appear here.' : undefined} />
      ) : (
        <ul className="space-y-3">
          {list.map((r) => {
            const team = byId(db.teams, r.teamId);
            const t = byId(db.tournaments, r.tournamentId);
            const roster = team ? teamMembers(db, team.id) : [];
            const { min, max } = rosterLimits(t?.format);
            const sizeOk = roster.length >= min && roster.length <= max;
            return (
              <li key={r.id} className="surface flex flex-col gap-4 p-4 md:flex-row md:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <TeamLogo team={team} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-mist-100">
                      <Link to={`/teams/${team?.id}`} className="hover:text-lime">{team?.name ?? 'Deleted team'}</Link>
                      <span className="font-normal text-mist-500"> → </span>
                      <Link to={`/tournaments/${t?.id}`} className="hover:text-lime">{t?.name}</Link>
                    </p>
                    <p className="text-xs text-mist-500">
                      {team?.college} · requested {formatDateTime(r.createdAt)} · <span className={sizeOk ? 'text-mist-400' : 'text-warn'}>roster {roster.length} (needs {min}–{max})</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <RegStatusBadge status={r.status} />
                  {r.status !== 'approved' && r.status !== 'withdrawn' && (
                    <Button size="sm" onClick={() => setReg(r, 'approved')} loading={busy === r.id + 'approved'}>
                      <Check className="h-4 w-4" /> Approve
                    </Button>
                  )}
                  {(r.status === 'pending' || r.status === 'approved') && (
                    <Button size="sm" variant="danger" onClick={() => setConfirm(r)}>
                      <X className="h-4 w-4" /> Reject
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => setReg(confirm, 'rejected')} loading={!!busy} title="Reject registration?" message="The team will lose its slot in this tournament. The captain will see the rejected status." confirmLabel="Reject" />
    </>
  );
}
