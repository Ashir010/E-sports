import { Link } from 'react-router-dom';
import { UserRound, Users, Trophy, ClipboardList, Swords, Activity, Plus, CalendarPlus } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LabelList } from 'recharts';
import { AdminHeader } from '../../layouts/AdminLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import { RowSkeleton } from '../../components/ui/States.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useDocumentTitle } from '../../hooks/index.js';
import { GAME_LIST } from '../../lib/constants.js';
import { platformStats, activityFeed, upcomingMatches, byId } from '../../utils/selectors.js';
import { relativeTime, formatDateTime, formatMoney } from '../../utils/format.js';

export default function Overview() {
  useDocumentTitle('Admin');
  const { db, loading } = useData();
  if (loading) return <RowSkeleton rows={8} />;
  const s = platformStats(db);
  const players = db.profiles.length;
  const feed = activityFeed(db, 8);
  const next = upcomingMatches(db, 5);
  const byGame = GAME_LIST.map((g) => ({
    name: g.name,
    teams: db.registrations.filter((r) => r.status === 'approved' && byId(db.tournaments, r.tournamentId)?.game === g.id).length,
  }));

  const cards = [
    { label: 'Total players', value: players, icon: UserRound, to: '/admin/players' },
    { label: 'Total teams', value: s.teams, icon: Users, to: '/admin/teams' },
    { label: 'Active tournaments', value: s.activeTournaments, icon: Trophy, to: '/admin/tournaments' },
    { label: 'Pending registrations', value: s.pendingRegistrations, icon: ClipboardList, to: '/admin/registrations?status=pending', warn: s.pendingRegistrations > 0 },
    { label: 'Completed matches', value: s.completedMatches, icon: Swords, to: '/admin/matches?status=completed' },
  ];

  return (
    <>
      <AdminHeader title="Overview" description="Platform health at a glance.">
        <Button to="/admin/tournaments?new=1" size="sm"><Plus className="h-4 w-4" /> New tournament</Button>
        <Button to="/admin/matches?new=1" size="sm" variant="secondary"><CalendarPlus className="h-4 w-4" /> Schedule match</Button>
      </AdminHeader>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="surface surface-hover p-4">
            <div className="flex items-center justify-between">
              <c.icon className={`h-5 w-5 ${c.warn ? 'text-warn' : 'text-lime'}`} aria-hidden />
            </div>
            <p className="mt-4 font-display text-3xl font-bold tabular text-mist-100">{c.value}</p>
            <p className="text-xs uppercase tracking-wider text-mist-500">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <figure className="surface p-5">
          <figcaption className="font-display text-base font-semibold uppercase text-mist-100">Approved registrations by game</figcaption>
          <p className="mb-4 text-xs text-mist-500">All tournaments, all time. Total prize pool across live & past events: {formatMoney(s.prizePool)}.</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byGame} margin={{ top: 16, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#5B6470" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#5B6470" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ background: '#111418', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#F2F4F7' }} itemStyle={{ color: '#D5DAE1' }} />
                <Bar dataKey="teams" name="Registrations" fill="#C6FF3D" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  <LabelList dataKey="teams" position="top" style={{ fill: '#A9B1BD', fontSize: 11 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </figure>
        <section className="surface p-5" aria-labelledby="act-h">
          <h2 id="act-h" className="mb-4 flex items-center gap-2 font-display text-base font-semibold uppercase"><Activity className="h-4 w-4 text-lime" /> Recent activity</h2>
          {feed.length ? (
            <ol className="space-y-3">
              {feed.map((a) => (
                <li key={a.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lime/70" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-mist-200">{a.message}</p>
                    <p className="text-xs text-mist-500">{relativeTime(a.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-mist-500">No activity yet.</p>
          )}
        </section>
      </div>

      <section className="surface mt-6 p-5" aria-labelledby="next-h">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="next-h" className="font-display text-base font-semibold uppercase">Next matches</h2>
          <Link to="/admin/matches" className="text-sm text-mist-400 hover:text-lime">Manage</Link>
        </div>
        <ul className="divide-y divide-white/5">
          {next.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
              <span className="text-mist-100">{byId(db.tournaments, m.tournamentId)?.name} · {m.round}</span>
              <span className="text-xs text-mist-400">{m.status === 'in_progress' ? 'In progress — awaiting result' : formatDateTime(m.scheduledAt)}</span>
            </li>
          ))}
          {!next.length && <li className="py-3 text-sm text-mist-500">Nothing scheduled.</li>}
        </ul>
      </section>
    </>
  );
}
