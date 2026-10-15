import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ChevronRight, Crown } from 'lucide-react';
import { TeamLogo } from '../ui/Avatar.jsx';
import { MatchStatusBadge } from '../ui/Badge.jsx';
import { GameChip } from '../ui/GameArt.jsx';
import { formatDateTime, cn } from '../../utils/format.js';
import { byId } from '../../utils/selectors.js';

export default function MatchCard({ match, db, compact = false }) {
  const tournament = byId(db.tournaments, match.tournamentId);
  const results = db.results.filter((r) => r.matchId === match.id);
  const teams = match.participants.map((id) => byId(db.teams, id));
  const isLobby = match.participants.length > 2;
  const winner = results.find((r) => r.isWinner);
  const statusTone = { in_progress: 'border-violet/40', completed: 'border-white/[0.07]', scheduled: 'border-white/[0.07]' }[match.status];

  return (
    <motion.article layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={cn('group relative overflow-hidden rounded-2xl border bg-ink-800/80 transition hover:border-white/15 hover:bg-ink-750', statusTone)}>
      {match.status === 'in_progress' && <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet via-cyan to-violet" aria-hidden />}
      <div className={cn('flex flex-col gap-4', compact ? 'p-4' : 'p-5')}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <GameChip game={tournament?.game} />
            <span className="text-mist-600" aria-hidden>·</span>
            <span className="truncate text-xs text-mist-400">{match.round}</span>
          </div>
          <MatchStatusBadge status={match.status} />
        </div>

        {isLobby ? (
          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex -space-x-2">
                {teams.slice(0, 6).map((t) => (
                  <TeamLogo key={t?.id} team={t} size="sm" className="ring-2 ring-ink-800" />
                ))}
              </div>
              <span className="font-mono text-xs text-mist-400">{teams.length}-team lobby</span>
            </div>
            {match.status === 'completed' && winner ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-mist-200">
                <Crown className="h-4 w-4 text-lime" aria-hidden /> Winner: <span className="font-semibold text-lime">{byId(db.teams, winner.teamId)?.name}</span>
              </p>
            ) : (
              <p className="mt-3 text-sm text-mist-400">{match.status === 'in_progress' ? 'Lobby in progress — standings posted after the match.' : 'Battle royale lobby'}</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <Side team={teams[0]} result={results.find((r) => r.teamId === teams[0]?.id)} completed={match.status === 'completed'} />
            <div className="text-center">
              {match.status === 'completed' && results.length ? (
                <p className="font-display text-2xl font-bold tabular text-mist-100">
                  {results.find((r) => r.teamId === teams[0]?.id)?.score ?? '–'}
                  <span className="mx-1.5 text-mist-600">:</span>
                  {results.find((r) => r.teamId === teams[1]?.id)?.score ?? '–'}
                </p>
              ) : (
                <span className="font-display text-sm font-bold text-mist-500">VS</span>
              )}
            </div>
            <Side team={teams[1]} result={results.find((r) => r.teamId === teams[1]?.id)} completed={match.status === 'completed'} align="right" />
          </div>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-3 text-xs text-mist-400">
          <div className="min-w-0">
            <p className="truncate text-mist-300">{tournament?.name}</p>
            <p className="mt-0.5 flex items-center gap-2">
              <time dateTime={match.scheduledAt}>{formatDateTime(match.scheduledAt)}</time>
              {match.map && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" aria-hidden />
                  {match.map}
                </span>
              )}
            </p>
          </div>
          <Link to={`/matches/${match.id}`} className="inline-flex shrink-0 items-center gap-0.5 rounded-lg px-2 py-1 font-medium text-mist-200 hover:bg-white/5 hover:text-lime" aria-label={`Match details: ${match.round}, ${tournament?.name}`}>
            Details <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

function Side({ team, result, completed, align }) {
  const won = completed && result?.isWinner;
  const lost = completed && result && !result.isWinner;
  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', align === 'right' && 'flex-row-reverse text-right')}>
      <TeamLogo team={team} size="md" />
      <div className="min-w-0">
        <p className={cn('truncate font-display text-sm font-semibold', won ? 'text-lime' : lost ? 'text-mist-400' : 'text-mist-100')}>{team?.name ?? 'TBD'}</p>
        {team && <p className="truncate text-[11px] text-mist-500">{team.college}</p>}
      </div>
    </div>
  );
}
