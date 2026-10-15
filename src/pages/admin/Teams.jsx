import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Trash2, Eye, Users } from 'lucide-react';
import { AdminHeader } from '../../layouts/AdminLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input, Select } from '../../components/ui/Field.jsx';
import { TeamLogo } from '../../components/ui/Avatar.jsx';
import { GameChip } from '../../components/ui/GameArt.jsx';
import { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { EmptyState, RowSkeleton } from '../../components/ui/States.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/index.js';
import { GAME_LIST, GAMES } from '../../lib/constants.js';
import { byId, teamMembers } from '../../utils/selectors.js';
import { rosterLimits } from '../../utils/registrationRules.js';

export default function AdminTeams() {
  useDocumentTitle('Admin · Teams');
  const { userId } = useAuth();
  const { db, loading, run } = useData();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [game, setGame] = useState('all');
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const list = db.teams
    .filter((t) => game === 'all' || t.game === game)
    .filter((t) => !q || `${t.name} ${t.tag} ${t.college}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const remove = async () => {
    setBusy(true);
    try {
      await run((api) => api.deleteTeam(userId, confirm.id));
      toast.success(`${confirm.name} deleted.`);
      setConfirm(null);
    } catch (e) {
      toast.error(e.message, 'Cannot delete');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AdminHeader title="Teams" description={`${db.teams.length} teams across all games.`} />
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_200px]">
        <Input icon={Search} placeholder="Name, tag or college" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search teams" />
        <Select aria-label="Game" value={game} onChange={(e) => setGame(e.target.value)} options={[{ value: 'all', label: 'All games' }, ...GAME_LIST.map((g) => ({ value: g.id, label: g.name }))]} />
      </div>
      {loading ? (
        <RowSkeleton />
      ) : list.length === 0 ? (
        <EmptyState icon={Users} title="No teams found" />
      ) : (
        <div className="surface overflow-hidden">
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left font-mono text-[11px] uppercase tracking-wider text-mist-500">
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3">Game</th>
                  <th className="px-4 py-3">Captain</th>
                  <th className="px-4 py-3">Roster</th>
                  <th className="px-4 py-3">Invite code</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((t) => {
                  const members = teamMembers(db, t.id);
                  const { min, max } = rosterLimits(GAMES[t.game].defaultFormat);
                  return (
                    <tr key={t.id} className="table-row-hover border-b border-white/[0.04] last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <TeamLogo team={t} size="sm" />
                          <div className="min-w-0">
                            <p className="font-medium text-mist-100">{t.name}</p>
                            <p className="truncate text-xs text-mist-500">{t.college}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><GameChip game={t.game} /></td>
                      <td className="px-4 py-3 text-mist-300">{byId(db.profiles, t.captainId)?.username}</td>
                      <td className={`px-4 py-3 tabular ${members.length < min ? 'text-warn' : 'text-mist-300'}`}>{members.length}/{max}</td>
                      <td className="px-4 py-3 font-mono text-xs text-mist-400">{t.inviteCode ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Link to={`/teams/${t.id}`} className="flex h-10 w-10 items-center justify-center rounded-xl text-mist-400 hover:bg-white/5 hover:text-mist-100" aria-label={`View ${t.name}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Button size="icon" variant="ghost" className="text-danger hover:bg-danger/10" onClick={() => setConfirm(t)} aria-label={`Delete ${t.name}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={remove} loading={busy} title={`Delete ${confirm?.name}?`} message="Teams with match history or active registrations cannot be deleted, to keep standings accurate." confirmLabel="Delete team" />
    </>
  );
}
