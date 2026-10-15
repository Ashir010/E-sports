import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Search, Eye, Rocket, Ban, Flag, PlayCircle } from 'lucide-react';
import { AdminHeader } from '../../layouts/AdminLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal, { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { Input, Select } from '../../components/ui/Field.jsx';
import { TournamentStatusBadge } from '../../components/ui/Badge.jsx';
import { GameChip } from '../../components/ui/GameArt.jsx';
import { EmptyState, RowSkeleton } from '../../components/ui/States.jsx';
import TournamentForm, { toFormState } from '../../components/admin/TournamentForm.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/index.js';
import { TOURNAMENT_STATUS } from '../../lib/constants.js';
import { getDisplayStatus, activeRegistrations } from '../../utils/registrationRules.js';
import { validateTournament, hasErrors } from '../../utils/validation.js';
import { formatMoney, formatDate, istLocalToIso } from '../../utils/format.js';

const NEXT_ACTIONS = {
  draft: [{ status: 'open', label: 'Publish & open registration', icon: Rocket }],
  open: [{ status: 'upcoming', label: 'Close registration', icon: Flag }],
  upcoming: [{ status: 'ongoing', label: 'Start tournament', icon: PlayCircle }],
  ongoing: [{ status: 'completed', label: 'Mark completed', icon: Flag }],
};

export default function AdminTournaments() {
  useDocumentTitle('Admin · Tournaments');
  const { userId } = useAuth();
  const { db, loading, run } = useData();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    if (params.get('new')) {
      setForm(toFormState(null));
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const list = db.tournaments
    .filter((t) => status === 'all' || t.status === status)
    .filter((t) => !q || t.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => new Date(b.startAt) - new Date(a.startAt));

  const save = async () => {
    const payload = {
      ...form,
      maxTeams: Number(form.maxTeams),
      entryFee: Number(form.entryFee),
      prizePool: Number(form.prizePool),
      regDeadline: istLocalToIso(form.regDeadline),
      startAt: istLocalToIso(form.startAt),
      endAt: istLocalToIso(form.endAt),
      prizeDistribution: form.prizeDistribution.filter((p) => p.place.trim()),
      rules: form.rulesText.split('\n').map((s) => s.trim()).filter(Boolean),
      requirements: form.requirementsText.split('\n').map((s) => s.trim()).filter(Boolean),
    };
    delete payload.rulesText;
    delete payload.requirementsText;
    const errs = validateTournament(payload);
    const distributed = payload.prizeDistribution.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    if (distributed > payload.prizePool) errs.prizeDistribution = 'Prize distribution exceeds the prize pool.';
    if (payload.scoringRules.type === 'br' && !payload.scoringRules.placementPoints.length) errs.prizeDistribution = 'Add placement points.';
    setErrors(errs);
    if (hasErrors(errs)) {
      toast.error(Object.values(errs)[0], 'Check the form');
      return;
    }
    setBusy(true);
    try {
      await run((api) => api.saveTournament(userId, payload));
      toast.success(form.id ? 'Tournament updated.' : 'Tournament created.');
      setForm(null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async () => {
    setBusy(true);
    try {
      await run((api) => api.setTournamentStatus(userId, confirm.t.id, confirm.status));
      toast.success(`${confirm.t.name} → ${TOURNAMENT_STATUS[confirm.status]}`);
      setConfirm(null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AdminHeader title="Tournaments" description="Create, publish, run and close tournaments.">
        <Button size="sm" onClick={() => { setErrors({}); setForm(toFormState(null)); }}>
          <Plus className="h-4 w-4" /> New tournament
        </Button>
      </AdminHeader>
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px]">
        <Input icon={Search} placeholder="Search tournaments" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search tournaments" />
        <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} options={[{ value: 'all', label: 'All statuses' }, ...Object.entries(TOURNAMENT_STATUS).map(([value, label]) => ({ value, label }))]} />
      </div>
      {loading ? (
        <RowSkeleton />
      ) : list.length === 0 ? (
        <EmptyState title="No tournaments" message="Create your first tournament to get started." />
      ) : (
        <div className="surface overflow-hidden">
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left font-mono text-[11px] uppercase tracking-wider text-mist-500">
                  <th className="px-4 py-3">Tournament</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Teams</th>
                  <th className="px-4 py-3">Prize</th>
                  <th className="px-4 py-3">Starts</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((t) => (
                  <tr key={t.id} className="table-row-hover border-b border-white/[0.04] last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-mist-100">{t.name}</p>
                      <GameChip game={t.game} className="text-[11px]" />
                    </td>
                    <td className="px-4 py-3"><TournamentStatusBadge status={getDisplayStatus(t)} /></td>
                    <td className="px-4 py-3 tabular text-mist-300">{activeRegistrations(db.registrations, t.id).length}/{t.maxTeams}</td>
                    <td className="px-4 py-3 tabular text-mist-300">{formatMoney(t.prizePool)}</td>
                    <td className="px-4 py-3 text-mist-300">{formatDate(t.startAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {(NEXT_ACTIONS[t.status] ?? []).map((a) => (
                          <Button key={a.status} size="sm" variant="secondary" onClick={() => setConfirm({ t, status: a.status, label: a.label })} title={a.label}>
                            <a.icon className="h-4 w-4" /> <span className="hidden xl:inline">{a.label}</span>
                          </Button>
                        ))}
                        <Button size="icon" variant="ghost" onClick={() => { setErrors({}); setForm(toFormState(t)); }} aria-label={`Edit ${t.name}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Link to={`/tournaments/${t.id}`} className="flex h-10 w-10 items-center justify-center rounded-xl text-mist-400 hover:bg-white/5 hover:text-mist-100" aria-label={`View ${t.name}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                        {!['completed', 'cancelled'].includes(t.status) && (
                          <Button size="icon" variant="ghost" className="text-danger hover:bg-danger/10" onClick={() => setConfirm({ t, status: 'cancelled', label: 'Cancel tournament' })} aria-label={`Cancel ${t.name}`}>
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={!!form}
        onClose={() => !busy && setForm(null)}
        title={form?.id ? 'Edit tournament' : 'New tournament'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setForm(null)} disabled={busy}>Cancel</Button>
            <Button onClick={save} loading={busy}>{form?.id ? 'Save changes' : 'Create tournament'}</Button>
          </>
        }
      >
        {form && <TournamentForm form={form} setForm={setForm} errors={errors} />}
      </Modal>
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={changeStatus}
        loading={busy}
        title={`${confirm?.label}?`}
        message={confirm?.status === 'cancelled' ? `${confirm?.t.name} will be marked cancelled and removed from standings. This is visible to all players.` : `${confirm?.t.name} will move to “${TOURNAMENT_STATUS[confirm?.status]}”.`}
        confirmLabel={confirm?.label}
        tone={confirm?.status === 'cancelled' ? 'danger' : 'primary'}
      />
    </>
  );
}
