import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, CalendarDays, Trophy, Crown, Info } from 'lucide-react';
import GameArt from '../../components/ui/GameArt.jsx';
import { MatchStatusBadge } from '../../components/ui/Badge.jsx';
import { TeamLogo } from '../../components/ui/Avatar.jsx';
import PageFallback from '../../components/ui/PageFallback.jsx';
import { ErrorState } from '../../components/ui/States.jsx';
import NotFound from './NotFound.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDocumentTitle } from '../../hooks/index.js';
import { GAMES } from '../../lib/constants.js';
import { byId, teamMembers } from '../../utils/selectors.js';
import { rulesFor, scoreResult } from '../../utils/scoring.js';
import { formatDateTime, cn } from '../../utils/format.js';

export default function MatchDetail() {
  const { id } = useParams();
  const { db, loading, error, refresh } = useData();
  const { isAdmin } = useAuth();
  const match = byId(db.matches, id);
  const tournament = match ? byId(db.tournaments, match.tournamentId) : null;
  useDocumentTitle(match ? `${match.round} · ${tournament?.name}` : 'Match');

  if (loading) return <PageFallback />;
  if (error) return <div className="container-page pt-32"><ErrorState message={error} onRetry={refresh} /></div>;
  if (!match || !tournament || (tournament.status === 'draft' && !isAdmin)) return <NotFound what="match" />;

  const results = db.results.filter((r) => r.matchId === match.id);
  const rules = rulesFor(tournament);
  const isLobby = rules.type === 'br' || match.participants.length > 2;
  const teams = match.participants.map((tid) => byId(db.teams, tid));

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/5 pt-20">
        <GameArt game={tournament.game} className="absolute inset-0 opacity-50" label={false} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/80 to-ink-900/40" aria-hidden />
        <div className="container-page relative py-10">
          <Link to={`/tournaments/${tournament.id}`} className="mb-5 inline-flex items-center gap-1.5 text-sm text-mist-400 hover:text-lime">
            <ArrowLeft className="h-4 w-4" /> {tournament.name}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <MatchStatusBadge status={match.status} />
            <span className="font-mono text-xs uppercase tracking-wider text-mist-300">{GAMES[tournament.game].name} · {match.round}</span>
          </div>
          {!isLobby && <h1 className="sr-only">{teams.map((t) => t?.name ?? 'TBD').join(' vs ')} — {match.round}</h1>}
          {!isLobby ? (
            <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-10">
              {[0, 1].map((i) => {
                const team = teams[i];
                const res = results.find((r) => r.teamId === team?.id);
                return (
                  <div key={i} className={cn('flex flex-col items-center gap-3 text-center', i === 0 ? 'sm:items-end sm:text-right' : 'sm:items-start sm:text-left')}>
                    <TeamLogo team={team} size="xl" />
                    {team ? (
                      <Link to={`/teams/${team.id}`} className={cn('font-display text-lg font-bold uppercase hover:text-lime sm:text-3xl', res?.isWinner ? 'text-lime' : 'text-mist-100')}>
                        {team.name}
                      </Link>
                    ) : (
                      <p className="font-display text-lg font-bold text-mist-400 sm:text-3xl">TBD</p>
                    )}
                    {res?.isWinner && <span className="inline-flex items-center gap-1 text-xs text-lime"><Crown className="h-3.5 w-3.5" /> Winner</span>}
                  </div>
                );
              })}
              <div className="order-none text-center" style={{ gridColumn: 2, gridRow: 1 }}>
                {match.status === 'completed' && results.length ? (
                  <p className="font-display text-5xl font-bold tabular text-mist-100 sm:text-7xl">
                    {results.find((r) => r.teamId === teams[0]?.id)?.score}
                    <span className="mx-2 text-mist-600">:</span>
                    {results.find((r) => r.teamId === teams[1]?.id)?.score}
                  </p>
                ) : (
                  <p className="font-display text-3xl font-bold text-mist-500 sm:text-5xl">VS</p>
                )}
              </div>
            </div>
          ) : (
            <h1 className="mt-4 text-4xl font-bold uppercase sm:text-5xl">{match.round}</h1>
          )}
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-mist-300">
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-mist-500" /> {formatDateTime(match.scheduledAt)}</span>
            {match.map && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-mist-500" /> {match.map}</span>}
            <span className="inline-flex items-center gap-1.5"><Trophy className="h-4 w-4 text-mist-500" /> {tournament.name}</span>
          </div>
        </div>
      </section>

      <div className="container-page space-y-8 py-10">
        {match.status !== 'completed' && (
          <p className="flex items-start gap-2 rounded-xl border border-white/[0.07] bg-ink-850 px-4 py-3 text-sm text-mist-300">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan" aria-hidden />
            {match.status === 'in_progress' ? 'This match is being played now. The result will appear here once an admin posts it — there is no live score feed.' : 'Results will be posted here by a tournament admin after the match.'}
          </p>
        )}

        {isLobby && (
          <section className="surface overflow-hidden" aria-labelledby="lobby-title">
            <h2 id="lobby-title" className="border-b border-white/5 px-5 py-4 text-lg font-semibold uppercase">
              {match.status === 'completed' ? 'Lobby results' : 'Teams in lobby'}
            </h2>
            <div className="scrollbar-thin overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-mist-500">
                    <th className="px-5 py-3">#</th>
                    <th className="px-5 py-3">Team</th>
                    <th className="px-5 py-3 text-right">Kills</th>
                    <th className="px-5 py-3 text-right">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {(results.length ? [...results].sort((a, b) => a.placement - b.placement) : match.participants.map((teamId) => ({ teamId }))).map((r) => {
                    const team = byId(db.teams, r.teamId);
                    const pts = r.placement ? scoreResult(r, rules, results).points : null;
                    return (
                      <tr key={r.teamId} className={cn('table-row-hover border-t border-white/[0.04]', r.placement === 1 && 'bg-lime/[0.06]')}>
                        <td className={cn('px-5 py-3 font-display font-bold', r.placement === 1 ? 'text-lime' : 'text-mist-400')}>{r.placement ?? '—'}</td>
                        <td className="px-5 py-3">
                          <Link to={`/teams/${team?.id}`} className="flex items-center gap-3 hover:text-lime">
                            <TeamLogo team={team} size="sm" />
                            <span className="font-medium text-mist-100">{team?.name}</span>
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-right tabular">{r.kills ?? '—'}</td>
                        <td className="px-5 py-3 text-right font-display font-bold tabular text-mist-100">{pts ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {!isLobby && teams.filter(Boolean).length > 0 && (
          <div className="grid gap-5 md:grid-cols-2">
            {teams.filter(Boolean).map((team) => (
              <section key={team.id} className="surface p-5" aria-label={`${team.name} roster`}>
                <h2 className="mb-4 flex items-center gap-3 text-lg font-semibold uppercase">
                  <TeamLogo team={team} size="sm" /> {team.name}
                </h2>
                <ul className="space-y-2">
                  {teamMembers(db, team.id).map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-3 text-sm">
                      <Link to={`/players/${m.profile?.username}`} className="truncate text-mist-200 hover:text-lime">
                        {m.profile?.username}
                      </Link>
                      <span className="font-mono text-xs text-mist-500">{m.role === 'captain' ? 'Captain' : m.inGameId}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
