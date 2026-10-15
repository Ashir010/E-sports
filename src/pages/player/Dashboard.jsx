import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, KeyRound, Trophy, Swords, Pencil, ArrowRight, Shield, Crown } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import { Avatar, TeamLogo } from '../../components/ui/Avatar.jsx';
import { RegStatusBadge, TournamentStatusBadge } from '../../components/ui/Badge.jsx';
import { GameChip } from '../../components/ui/GameArt.jsx';
import { EmptyState } from '../../components/ui/States.jsx';
import MatchCard from '../../components/matches/MatchCard.jsx';
import TournamentCard from '../../components/tournaments/TournamentCard.jsx';
import { stagger, fadeUp } from '../../components/layout/Motion.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useDocumentTitle } from '../../hooks/index.js';
import { playerStats, teamsForUser, byId, achievementsFor } from '../../utils/selectors.js';
import { getDisplayStatus } from '../../utils/registrationRules.js';
import { filterTournaments } from '../../utils/tournamentFilters.js';
import { percent } from '../../utils/format.js';

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const { profile, isAdmin } = useAuth();
  const { db } = useData();
  const stats = playerStats(db, profile.id);
  const teams = teamsForUser(db, profile.id);
  const teamIds = new Set(teams.map((t) => t.id));
  const regs = db.registrations.filter((r) => teamIds.has(r.teamId) && r.status !== 'withdrawn').map((r) => ({ r, t: byId(db.tournaments, r.tournamentId), team: byId(db.teams, r.teamId) })).filter((x) => x.t && !['completed', 'cancelled'].includes(x.t.status));
  const upcoming = db.matches
    .filter((m) => m.status !== 'completed' && m.participants.some((p) => teamIds.has(p)))
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
    .slice(0, 4);
  const games = new Set(teams.map((t) => t.game));
  const suggestions = filterTournaments(db.tournaments.filter((t) => t.status !== 'draft' && (games.size === 0 || games.has(t.game))), { status: 'open', sort: 'date' }, db.registrations)
    .filter((t) => !regs.some((x) => x.t.id === t.id))
    .slice(0, 3);
  const achievements = achievementsFor(db, profile.id);

  return (
    <div className="container-page pb-10 pt-28">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-ink-850 p-6 sm:p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-lime/10 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
          <Avatar profile={profile} size="xl" />
          <div className="min-w-0 flex-1">
            <p className="eyebrow">Player dashboard</p>
            <h1 className="mt-1 truncate text-3xl font-bold uppercase sm:text-4xl">Welcome, {profile.displayName.split(' ')[0]}</h1>
            <p className="mt-1 text-sm text-mist-400">@{profile.username} · {profile.college}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdmin && <Button to="/admin" variant="violet" size="sm"><Shield className="h-4 w-4" /> Admin panel</Button>}
            <Button to="/profile/edit" variant="secondary" size="sm"><Pencil className="h-4 w-4" /> Edit profile</Button>
            <Button to={`/players/${profile.username}`} variant="ghost" size="sm">Public profile</Button>
          </div>
        </div>
        <motion.dl initial="hidden" animate="show" variants={stagger} className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ['Overall rank', stats.rank ? `#${stats.rank}` : '—'],
            ['Matches', stats.played],
            ['Wins', stats.wins],
            ['Win rate', percent(stats.winRate)],
            ['Tournaments', stats.tournaments],
          ].map(([k, v]) => (
            <motion.div key={k} variants={fadeUp} className="rounded-xl border border-white/[0.07] bg-ink-900/60 p-3">
              <dt className="text-[11px] uppercase tracking-wider text-mist-500">{k}</dt>
              <dd className="font-display text-2xl font-bold tabular text-mist-100">{v}</dd>
            </motion.div>
          ))}
        </motion.dl>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="up-h">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="up-h" className="flex items-center gap-2 text-xl font-semibold uppercase"><Swords className="h-5 w-5 text-lime" /> Your next matches</h2>
              <Link to="/matches" className="text-sm text-mist-400 hover:text-lime">Schedule</Link>
            </div>
            {upcoming.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {upcoming.map((m) => <MatchCard key={m.id} match={m} db={db} compact />)}
              </div>
            ) : (
              <EmptyState title="No upcoming matches" message="Register your team for a tournament to get on the schedule." className="py-10" />
            )}
          </section>

          <section aria-labelledby="reg-h">
            <h2 id="reg-h" className="mb-4 flex items-center gap-2 text-xl font-semibold uppercase"><Trophy className="h-5 w-5 text-lime" /> Active registrations</h2>
            {regs.length ? (
              <ul className="space-y-2">
                {regs.map(({ r, t, team }) => (
                  <li key={r.id}>
                    <Link to={`/tournaments/${t.id}`} className="surface surface-hover flex flex-wrap items-center gap-3 p-4">
                      <TeamLogo team={team} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-mist-100">{t.name}</p>
                        <p className="truncate text-xs text-mist-500">as {team.name}</p>
                      </div>
                      <TournamentStatusBadge status={getDisplayStatus(t)} />
                      <RegStatusBadge status={r.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No active registrations" className="py-10" />
            )}
          </section>

          {suggestions.length > 0 && (
            <section aria-labelledby="sug-h">
              <div className="mb-4 flex items-center justify-between">
                <h2 id="sug-h" className="text-xl font-semibold uppercase">Open for registration</h2>
                <Link to="/tournaments?status=open" className="inline-flex items-center gap-1 text-sm text-mist-400 hover:text-lime">All <ArrowRight className="h-3.5 w-3.5" /></Link>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {suggestions.map((t) => <TournamentCard key={t.id} tournament={t} registrations={db.registrations} />)}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className="surface p-5" aria-labelledby="teams-h">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="teams-h" className="text-lg font-semibold uppercase">My teams</h2>
              <Link to="/my-teams" className="text-sm text-mist-400 hover:text-lime">Manage</Link>
            </div>
            {teams.length ? (
              <ul className="space-y-2">
                {teams.map((t) => (
                  <li key={t.id}>
                    <Link to={`/teams/${t.id}/manage`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/[0.03]">
                      <TeamLogo team={t} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 truncate text-sm font-medium text-mist-100">{t.name} {t.captainId === profile.id && <Crown className="h-3.5 w-3.5 text-lime" aria-label="Captain" />}</p>
                        <GameChip game={t.game} className="text-[11px]" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-mist-500">You’re not on a team yet.</p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button to="/teams/create" size="sm"><Plus className="h-4 w-4" /> Create</Button>
              <Button to="/teams/join" size="sm" variant="secondary"><KeyRound className="h-4 w-4" /> Join</Button>
            </div>
          </section>
          <section className="surface p-5" aria-labelledby="ach-h">
            <h2 id="ach-h" className="mb-3 text-lg font-semibold uppercase">Achievements</h2>
            {achievements.length ? (
              <ul className="flex flex-wrap gap-2">
                {achievements.map((a) => (
                  <li key={a.id} className="rounded-lg border border-lime/20 bg-lime/5 px-2.5 py-1 text-xs text-lime" title={a.detail}>{a.title}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-mist-500">Play your first match to start unlocking achievements.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
