import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, Minus, Sparkles } from 'lucide-react';
import { TeamLogo, Avatar } from '../ui/Avatar.jsx';
import { GameChip } from '../ui/GameArt.jsx';
import { percent, cn } from '../../utils/format.js';
import { byId } from '../../utils/selectors.js';

const TOP = {
  1: 'bg-gradient-to-r from-lime/[0.12] to-transparent',
  2: 'bg-gradient-to-r from-cyan/[0.08] to-transparent',
  3: 'bg-gradient-to-r from-violet/[0.10] to-transparent',
};
const RANK_COLOR = { 1: 'text-lime', 2: 'text-cyan', 3: 'text-violet-400' };

export function RankDelta({ movement, isNew }) {
  if (isNew) return <span className="inline-flex items-center gap-0.5 text-[11px] text-cyan" title="New entry"><Sparkles className="h-3 w-3" /> NEW</span>;
  if (!movement) return <Minus className="h-3.5 w-3.5 text-mist-600" aria-label="No change" />;
  const up = movement > 0;
  return (
    <span className={cn('inline-flex items-center gap-0.5 font-mono text-[11px] tabular', up ? 'text-lime' : 'text-danger')} aria-label={`${up ? 'Up' : 'Down'} ${Math.abs(movement)}`}>
      {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(movement)}
    </span>
  );
}

/** Team or player rankings table. `kind` = 'team' | 'player'. */
export default function LeaderboardTable({ rows, db, kind = 'team', compact = false, highlightId }) {
  return (
    <div className="surface overflow-hidden">
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left font-mono text-[11px] uppercase tracking-wider text-mist-500">
              <th scope="col" className="w-16 px-4 py-3">Rank</th>
              <th scope="col" className="px-4 py-3">{kind === 'team' ? 'Team' : 'Player'}</th>
              <th scope="col" className="px-3 py-3 text-right">MP</th>
              <th scope="col" className="px-3 py-3 text-right">W</th>
              <th scope="col" className="px-3 py-3 text-right">L</th>
              {!compact && <th scope="col" className="hidden px-3 py-3 md:table-cell">Form</th>}
              <th scope="col" className="px-3 py-3 text-right">Win %</th>
              <th scope="col" className="px-4 py-3 text-right">Pts</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {rows.map((r) => {
                const id = kind === 'team' ? r.teamId : r.profileId;
                const team = kind === 'team' ? byId(db.teams, r.teamId) : byId(db.teams, r.teamIds?.[0]);
                const profile = kind === 'player' ? byId(db.profiles, r.profileId) : null;
                return (
                  <motion.tr
                    key={id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className={cn('table-row-hover border-b border-white/[0.04] last:border-0', TOP[r.rank], highlightId === id && 'outline outline-1 -outline-offset-1 outline-lime/40')}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={cn('w-6 font-display text-lg font-bold tabular', RANK_COLOR[r.rank] ?? 'text-mist-400')}>{r.rank}</span>
                        {'movement' in r && <RankDelta movement={r.movement} isNew={r.isNew} />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {kind === 'team' ? (
                        <Link to={`/teams/${r.teamId}`} className="flex items-center gap-3 hover:text-lime">
                          <TeamLogo team={team} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-mist-100">{team?.name}</p>
                            <p className="flex items-center gap-2 text-[11px] text-mist-500">
                              <GameChip game={team?.game} className="text-[11px] text-mist-500" />
                              <span className="hidden truncate sm:inline">{team?.college}</span>
                            </p>
                          </div>
                        </Link>
                      ) : (
                        <Link to={`/players/${profile?.username}`} className="flex items-center gap-3 hover:text-lime">
                          <Avatar profile={profile} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-mist-100">{profile?.username}</p>
                            <p className="truncate text-[11px] text-mist-500">{team?.name}</p>
                          </div>
                        </Link>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right tabular text-mist-300">{r.played}</td>
                    <td className="px-3 py-3 text-right tabular text-mist-100">{r.wins}</td>
                    <td className="px-3 py-3 text-right tabular text-mist-400">{r.losses + (r.draws ?? 0)}</td>
                    {!compact && (
                      <td className="hidden px-3 py-3 md:table-cell">
                        <div className="flex gap-1">
                          {(r.form ?? []).map((f, i) => (
                            <span key={i} className={cn('flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold', f === 'W' ? 'bg-lime/15 text-lime' : f === 'D' ? 'bg-white/10 text-mist-300' : 'bg-danger/10 text-danger')}>
                              {f}
                            </span>
                          ))}
                        </div>
                      </td>
                    )}
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="hidden h-1 w-12 overflow-hidden rounded-full bg-white/5 sm:block" aria-hidden>
                          <div className="h-full bg-lime/70" style={{ width: percent(r.winRate) }} />
                        </div>
                        <span className="tabular text-mist-200">{percent(r.winRate)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-display text-base font-bold tabular text-mist-100">{r.points}</td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
