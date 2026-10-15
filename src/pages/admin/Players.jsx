import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShieldCheck, ShieldOff, UserRound } from 'lucide-react';
import { AdminHeader } from '../../layouts/AdminLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { Input, Select } from '../../components/ui/Field.jsx';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { EmptyState, RowSkeleton } from '../../components/ui/States.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/index.js';
import { teamsForUser } from '../../utils/selectors.js';
import { formatDate } from '../../utils/format.js';

const PAGE = 25;

export default function AdminPlayers() {
  useDocumentTitle('Admin · Players');
  const { userId } = useAuth();
  const { db, loading, run } = useData();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [role, setRole] = useState('all');
  const [limit, setLimit] = useState(PAGE);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const list = db.profiles
    .filter((p) => role === 'all' || p.role === role)
    .filter((p) => !q || `${p.username} ${p.displayName} ${p.college}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (a.role === 'admin' ? -1 : 0) - (b.role === 'admin' ? -1 : 0) || a.username.localeCompare(b.username));

  const apply = async () => {
    setBusy(true);
    try {
      await run((api) => api.setRole(userId, confirm.p.id, confirm.role));
      toast.success(`${confirm.p.username} is now ${confirm.role === 'admin' ? 'an admin' : 'a player'}.`);
      setConfirm(null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AdminHeader title="Players" description={`${db.profiles.length} registered accounts. Role changes are enforced by the database.`} />
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_200px]">
        <Input icon={Search} placeholder="Username, name or college" value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }} aria-label="Search players" />
        <Select aria-label="Role" value={role} onChange={(e) => setRole(e.target.value)} options={[{ value: 'all', label: 'All roles' }, { value: 'player', label: 'Players' }, { value: 'admin', label: 'Admins' }]} />
      </div>
      {loading ? (
        <RowSkeleton />
      ) : list.length === 0 ? (
        <EmptyState icon={UserRound} title="No players found" />
      ) : (
        <>
          <div className="surface overflow-hidden">
            <div className="scrollbar-thin overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-left font-mono text-[11px] uppercase tracking-wider text-mist-500">
                    <th className="px-4 py-3">Player</th>
                    <th className="px-4 py-3">College</th>
                    <th className="px-4 py-3">Teams</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3 text-right">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {list.slice(0, limit).map((p) => (
                    <tr key={p.id} className="table-row-hover border-b border-white/[0.04] last:border-0">
                      <td className="px-4 py-3">
                        <Link to={`/players/${p.username}`} className="flex items-center gap-3 hover:text-lime">
                          <Avatar profile={p} size="sm" />
                          <div>
                            <p className="font-medium text-mist-100">{p.username}</p>
                            <p className="text-xs text-mist-500">{p.displayName}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-mist-300">{p.college}</td>
                      <td className="px-4 py-3 text-mist-300">{teamsForUser(db, p.id).map((t) => t.tag).join(', ') || '—'}</td>
                      <td className="px-4 py-3 text-mist-400">{formatDate(p.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {p.role === 'admin' ? <Badge tone="violet">Admin</Badge> : <Badge>Player</Badge>}
                          {p.id !== userId &&
                            (p.role === 'admin' ? (
                              <Button size="sm" variant="ghost" onClick={() => setConfirm({ p, role: 'player' })} aria-label={`Remove admin from ${p.username}`}>
                                <ShieldOff className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" onClick={() => setConfirm({ p, role: 'admin' })} aria-label={`Make ${p.username} admin`}>
                                <ShieldCheck className="h-4 w-4" />
                              </Button>
                            ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {list.length > limit && (
            <div className="mt-4 text-center">
              <Button variant="secondary" size="sm" onClick={() => setLimit((l) => l + PAGE)}>Load more ({list.length - limit})</Button>
            </div>
          )}
        </>
      )}
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={apply}
        loading={busy}
        title={confirm?.role === 'admin' ? 'Grant admin access?' : 'Remove admin access?'}
        message={confirm?.role === 'admin' ? `${confirm?.p.username} will be able to edit tournaments, results and registrations.` : `${confirm?.p.username} will lose admin permissions.`}
        confirmLabel={confirm?.role === 'admin' ? 'Grant admin' : 'Remove admin'}
        tone={confirm?.role === 'admin' ? 'primary' : 'danger'}
      />
    </>
  );
}
