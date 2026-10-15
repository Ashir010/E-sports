import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Crown, Settings, Trophy, Swords } from 'lucide-react';
import { TeamLogo, Avatar } from '../../components/ui/Avatar.jsx';
import { GameChip } from '../../components/ui/GameArt.jsx';
import { RegStatusBadge, TournamentStatusBadge } from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import PageFallback from '../../components/ui/PageFallback.jsx';
import { EmptyState, ErrorState } from '../../components/ui/States.jsx';
import MatchCard from '../../components/matches/MatchCard.jsx';
import NotFound from './NotFound.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDocumentTitle } from '../../hooks/index.js';
import { byId, teamMembers, matchesForTeam } from '../../utils/selectors.js';
import { computeStandings, tournamentChampion } from '../../utils/scoring.js';
import { getDisplayStatus } from '../../utils/registrationRules.js';
import { percent } from '../../utils/format.js';
import { GAMES } from '../../lib/constants.js';

export default function TeamDetail() {
  const { id } = useParams();
  const { db, loading, error, refresh } = useData();
  const { userId } = useAuth();
  const team = byId(db.teams, id);
  useDocumentTitle(team?.name ?? 'Team');

  if (loading) return <PageFallback />;
  if (error) return <div className="container-page pt-32"><ErrorState message={error} onRetry={refresh} /></div>;
  if (!team) return <NotFound what="team" />;

  const members = teamMembers(db, team.id);
  const stats = computeStandings(db, { game: team.game }).find((r) => r.teamId === team.id);
  const regs = db.registrations.filter((r) => r.teamId === team.id && r.status !== 'withdrawn').map((r) => ({ r, t: byId(db.tournaments, r.tournamentId) })).filter((x) => x.t && x.t.status !== 'draft');
  const titles = db.tournaments.filter((t) => tournamentChampion(db, t)?.teamId === team.id);
  const matches = matchesForTeam(db, team.id).slice(0, 6);

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/5 pt-20">
        <div className="absolute inset-0 opacity-40" style={{ background: `radial-gradient(ellipse at 20% 0%, ${team.color}40, transparent 60%)` }} aria-hidden />
        <div className="bg-grid mask-fade-b absolute inset-0 opacity-50" aria-hidden />
        <div className="container-page relative py-10">
          <Link to="/teams" className="mb-6 inline-flex items-center gap-1.5 text-sm text-mist-400 hover:text-lime">
            <ArrowLeft className="h-4 w-4" /> All teams
          </Link>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <TeamLogo team={team} size="xl" />
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-mist-400">[{team.tag}]</p>
              <h1 className="text-4xl font-bold uppercase sm:text-5xl">{team.name}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-mist-400">
                <GameChip game={team.game} /> <span>{team.college}</span>
              </p>
            </div>
            {team.captainId === userId && (
              <Button to={`/teams/${team.id}/manage`} variant="secondary">
                <Settings className="h-4 w-4" /> Manage team
              </Button>
            )}
          </div>
          <dl className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Rank', stats ? `#${stats.rank}` : '—'],
              ['Matches', stats?.played ?? 0],
              ['Win rate', stats ? percent(stats.winRate) : '—'],
              ['Titles', titles.length],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-white/[0.07] bg-ink-900/60 p-3">
                <dt className="text-[11px] uppercase tracking-wider text-mist-500">{k}</dt>
                <dd className="font-display text-2xl font-bold tabular text-mist-100">{v}</dd>
              </div>
            ))}
          </dl>
          {stats && <p className="mt-2 text-xs text-mist-500">Rank within {GAMES[team.game].name} standings.</p>}
        </div>
      </section>

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="recent-title">
            <h2 id="recent-title" className="mb-4 flex items-center gap-2 text-xl font-semibold uppercase"><Swords className="h-5 w-5 text-lime" /> Matches</h2>
            {matches.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {matches.map((m) => (
                  <MatchCard key={m.id} match={m} db={db} compact />
                ))}
              </div>
            ) : (
              <EmptyState title="No matches yet" message="Matches appear once this team is scheduled in a tournament." />
            )}
          </section>
          <section aria-labelledby="tourn-title">
            <h2 id="tourn-title" className="mb-4 flex items-center gap-2 text-xl font-semibold uppercase"><Trophy className="h-5 w-5 text-lime" /> Tournaments</h2>
            {regs.length ? (
              <ul className="space-y-2">
                {regs.map(({ r, t }) => (
                  <li key={r.id}>
                    <Link to={`/tournaments/${t.id}`} className="surface surface-hover flex flex-wrap items-center gap-3 p-4">
                      <span className="min-w-0 flex-1 truncate font-medium text-mist-100">{t.name}</span>
                      {titles.some((x) => x.id === t.id) && <span className="inline-flex items-center gap-1 text-xs text-lime"><Crown className="h-3.5 w-3.5" /> Champion</span>}
                      <TournamentStatusBadge status={getDisplayStatus(t)} />
                      <RegStatusBadge status={r.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No tournaments yet" />
            )}
          </section>
        </div>
        <aside>
          <section className="surface p-5" aria-labelledby="roster-title">
            <h2 id="roster-title" className="mb-4 text-lg font-semibold uppercase">Roster <span className="text-mist-500">({members.length})</span></h2>
            <ul className="space-y-3">
              {members.map((m) => (
                <li key={m.id}>
                  <Link to={`/players/${m.profile?.username}`} className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-white/[0.03]">
                    <Avatar profile={m.profile} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate font-medium text-mist-100">
                        {m.profile?.username}
                        {m.role === 'captain' && <Crown className="h-3.5 w-3.5 text-lime" aria-label="Captain" />}
                      </p>
                      <p className="truncate font-mono text-xs text-mist-500">{m.inGameId}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}
