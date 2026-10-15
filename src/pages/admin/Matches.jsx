import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarPlus, Pencil, Trash2, ClipboardCheck, Swords } from 'lucide-react';
import { AdminHeader } from '../../layouts/AdminLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import Tabs from '../../components/ui/Tabs.jsx';
import Modal, { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { Input, Select } from '../../components/ui/Field.jsx';
import { MatchStatusBadge } from '../../components/ui/Badge.jsx';
import { TeamLogo } from '../../components/ui/Avatar.jsx';
import { EmptyState, RowSkeleton } from '../../components/ui/States.jsx';
import ResultForm, { initialResults, buildResults } from '../../components/admin/ResultForm.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/index.js';
import { byId } from '../../utils/selectors.js';
import { rulesFor } from '../../utils/scoring.js';
import { formatDateTime, isoToIstLocal, istLocalToIso, cn } from '../../utils/format.js';

const blank = (tournamentId = '') => ({ id: null, tournamentId, round: '', scheduledAt: '', map: '', status: 'scheduled', participants: [] });

export default function AdminMatches() {
  useDocumentTitle('Admin · Matches');
  const { userId } = useAuth();
  const { db, loading, run } = useData();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState(params.get('status') ?? 'all');
  const [tournamentId, setTournamentId] = useState('');
  const [edit, setEdit] = useState(null);
  const [results, setResults] = useState(null); // { match, rows, type }
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (params.get('new')) {
      setEdit(blank());
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const runnable = db.tournaments.filter((t) => !['draft', 'cancelled'].includes(t.status));
  const list = db.matches
    .filter((m) => status === 'all' || m.status === status)
    .filter((m) => !tournamentId || m.tournamentId === tournamentId)
    .sort((a, b) => (a.status === 'in_progress' ? -1 : 0) - (b.status === 'in_progress' ? -1 : 0) || new Date(b.scheduledAt) - new Date(a.scheduledAt));

  const exec = async (fn, msg, after) => {
    setBusy(true);
    try {
      await run(fn);
      toast.success(msg);
      after?.();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const saveMatch = () => {
    if (!edit.tournamentId) return toast.error('Select a tournament.');
    if (!edit.round.trim()) return toast.error('Enter a round name.');
    if (!edit.scheduledAt) return toast.error('Set the date and time.');
    if (edit.participants.length < 2) return toast.error('Select at least two teams.');
    exec((api) => api.saveMatch(userId, { ...edit, scheduledAt: istLocalToIso(edit.scheduledAt) }), edit.id ? 'Match updated.' : 'Match scheduled.', () => setEdit(null));
  };

  const saveResults = () => {
    const { errors, results: rows } = buildResults(results.rows, results.type);
    if (errors.length) return toast.error(errors[0], 'Check results');
    exec((api) => api.saveResults(userId, results.match.id, rows), 'Result saved — standings recalculated.', () => setResults(null));
  };

  const editTournament = byId(db.tournaments, edit?.tournamentId);
  const eligibleTeams = editTournament ? db.registrations.filter((r) => r.tournamentId === editTournament.id && r.status === 'approved').map((r) => byId(db.teams, r.teamId)).filter(Boolean) : [];
  const isBR = editTournament && rulesFor(editTournament).type === 'br';

  return (
    <>
      <AdminHeader title="Matches" description="Schedule fixtures and enter results. Standings update automatically from results.">
        <Button size="sm" onClick={() => setEdit(blank(tournamentId))}><CalendarPlus className="h-4 w-4" /> Schedule match</Button>
      </AdminHeader>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          value={status}
          onChange={setStatus}
          ariaLabel="Match status"
          options={[
            { value: 'all', label: 'All' },
            { value: 'scheduled', label: 'Scheduled' },
            { value: 'in_progress', label: 'In progress' },
            { value: 'completed', label: 'Completed' },
          ]}
        />
        <Select aria-label="Tournament" value={tournamentId} onChange={(e) => setTournamentId(e.target.value)} options={[{ value: '', label: 'All tournaments' }, ...db.tournaments.map((t) => ({ value: t.id, label: t.name }))]} className="lg:w-72" />
      </div>

      {loading ? (
        <RowSkeleton />
      ) : list.length === 0 ? (
        <EmptyState icon={Swords} title="No matches" message="Schedule a match for an active tournament." />
      ) : (
        <ul className="space-y-2">
          {list.map((m) => {
            const t = byId(db.tournaments, m.tournamentId);
            const type = rulesFor(t).type;
            const res = db.results.filter((r) => r.matchId === m.id);
            const winner = res.find((r) => r.isWinner);
            return (
              <li key={m.id} className={cn('surface flex flex-col gap-3 p-4 md:flex-row md:items-center', m.status === 'in_progress' && 'border-violet/40')}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <MatchStatusBadge status={m.status} />
                    <span className="truncate text-sm font-medium text-mist-100">{t?.name} · {m.round}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-mist-400">
                    <span>{formatDateTime(m.scheduledAt)}</span>
                    <span className="flex -space-x-1.5">
                      {m.participants.slice(0, 8).map((id) => <TeamLogo key={id} team={byId(db.teams, id)} size="xs" className="ring-2 ring-ink-800" />)}
                    </span>
                    {m.participants.length === 2 && <span>{m.participants.map((id) => byId(db.teams, id)?.tag).join(' vs ')}</span>}
                    {m.participants.length === 0 && <span className="text-warn">Teams TBD</span>}
                    {winner && <span className="text-lime">· Winner: {byId(db.teams, winner.teamId)?.name}</span>}
                    {m.status === 'completed' && !winner && type === 'h2h' && res.length > 0 && <span>· Draw</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant={m.status === 'completed' ? 'secondary' : 'primary'} disabled={m.participants.length < 2} onClick={() => setResults({ match: m, rows: initialResults(db, m), type })}>
                    <ClipboardCheck className="h-4 w-4" /> {m.status === 'completed' ? 'Edit result' : 'Enter result'}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEdit({ ...m, scheduledAt: isoToIstLocal(m.scheduledAt) })} aria-label="Edit match">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-danger hover:bg-danger/10" onClick={() => setConfirm(m)} aria-label="Delete match">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={!!edit}
        onClose={() => !busy && setEdit(null)}
        title={edit?.id ? 'Edit match' : 'Schedule match'}
        description="Times are in IST. Only approved teams can be scheduled."
        footer={
          <>
            <Button variant="ghost" onClick={() => setEdit(null)} disabled={busy}>Cancel</Button>
            <Button onClick={saveMatch} loading={busy}>{edit?.id ? 'Save' : 'Schedule'}</Button>
          </>
        }
      >
        {edit && (
          <div className="space-y-4">
            <Select label="Tournament" required value={edit.tournamentId} onChange={(e) => setEdit({ ...edit, tournamentId: e.target.value, participants: [] })} options={[{ value: '', label: 'Select tournament' }, ...runnable.map((t) => ({ value: t.id, label: t.name }))]} disabled={!!edit.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Round" required placeholder={isBR ? 'Lobby 1' : 'Quarterfinal'} value={edit.round} onChange={(e) => setEdit({ ...edit, round: e.target.value })} />
              <Input label="Map" value={edit.map} onChange={(e) => setEdit({ ...edit, map: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Date & time (IST)" type="datetime-local" required value={edit.scheduledAt} onChange={(e) => setEdit({ ...edit, scheduledAt: e.target.value })} />
              <Select label="Status" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })} options={[{ value: 'scheduled', label: 'Scheduled' }, { value: 'in_progress', label: 'In progress' }, { value: 'cancelled', label: 'Cancelled' }, ...(edit.status === 'completed' ? [{ value: 'completed', label: 'Completed' }] : [])]} />
            </div>
            {edit.tournamentId && (
              <fieldset>
                <legend className="mb-2 text-xs font-medium uppercase tracking-wider text-mist-300">
                  Teams {isBR ? '(lobby — select all participating)' : '(select two)'} · {edit.participants.length} selected
                </legend>
                {eligibleTeams.length ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {eligibleTeams.map((t) => {
                      const on = edit.participants.includes(t.id);
                      const disabled = !on && !isBR && edit.participants.length >= 2;
                      return (
                        <label key={t.id} className={cn('flex cursor-pointer items-center gap-2 rounded-xl border p-2 text-sm', on ? 'border-lime/50 bg-lime/5' : 'border-white/10', disabled && 'cursor-not-allowed opacity-40')}>
                          <input type="checkbox" className="accent-lime" checked={on} disabled={disabled} onChange={() => setEdit({ ...edit, participants: on ? edit.participants.filter((x) => x !== t.id) : [...edit.participants, t.id] })} />
                          <TeamLogo team={t} size="xs" />
                          <span className="truncate text-mist-100">{t.name}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-warn">No approved teams in this tournament yet.</p>
                )}
              </fieldset>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={!!results}
        onClose={() => !busy && setResults(null)}
        title="Match result"
        description={results ? `${byId(db.tournaments, results.match.tournamentId)?.name} · ${results.match.round}` : ''}
        footer={
          <>
            <Button variant="ghost" onClick={() => setResults(null)} disabled={busy}>Cancel</Button>
            <Button onClick={saveResults} loading={busy}>Save result</Button>
          </>
        }
      >
        {results && <ResultForm db={db} rows={results.rows} setRows={(rows) => setResults({ ...results, rows })} type={results.type} />}
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => exec((api) => api.deleteMatch(userId, confirm.id), 'Match deleted.', () => setConfirm(null))} loading={busy} title="Delete match?" message="The match and any recorded results will be removed. Standings will be recalculated." confirmLabel="Delete" />
    </>
  );
}
