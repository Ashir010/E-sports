import { Link } from 'react-router-dom';
import { TeamLogo } from '../ui/Avatar.jsx';
import { byId } from '../../utils/selectors.js';
import { formatDate, cn } from '../../utils/format.js';

/** Round-by-round view of head-to-head matches (works for leagues and elimination brackets). */
export default function Bracket({ matches, db }) {
  const rounds = [];
  for (const m of matches) {
    let r = rounds.find((x) => x.name === m.round);
    if (!r) rounds.push((r = { name: m.round, matches: [] }));
    r.matches.push(m);
  }
  return (
    <div className="scrollbar-thin -mx-4 overflow-x-auto px-4 pb-2">
      <div className="flex min-w-max gap-5">
        {rounds.map((r, ri) => (
          <div key={r.name} className="w-64 shrink-0">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-mist-500">
              {r.name}
              <span className="ml-2 text-mist-600">{r.matches.length}</span>
            </p>
            <div className={cn('flex flex-col gap-3', ri > 0 && 'justify-around')}>
              {r.matches.map((m) => (
                <BracketMatch key={m.id} match={m} db={db} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BracketMatch({ match, db }) {
  const results = db.results.filter((r) => r.matchId === match.id);
  const slots = [...match.participants];
  while (slots.length < 2) slots.push(null);
  return (
    <Link to={`/matches/${match.id}`} className="block overflow-hidden rounded-xl border border-white/[0.07] bg-ink-850 transition hover:border-lime/30">
      {slots.map((teamId, i) => {
        const team = teamId ? byId(db.teams, teamId) : null;
        const res = results.find((r) => r.teamId === teamId);
        return (
          <div key={teamId ?? i} className={cn('flex items-center gap-2.5 px-3 py-2', i === 0 && 'border-b border-white/5', res?.isWinner && 'bg-lime/[0.06]')}>
            <TeamLogo team={team} size="xs" />
            <span className={cn('flex-1 truncate text-sm', res?.isWinner ? 'font-semibold text-lime' : res ? 'text-mist-400' : 'text-mist-200')}>{team?.name ?? 'TBD'}</span>
            <span className="font-display text-sm font-bold tabular text-mist-200">{res?.score ?? ''}</span>
          </div>
        );
      })}
      <p className="border-t border-white/5 px-3 py-1 text-[10px] uppercase tracking-wider text-mist-600">
        {match.status === 'completed' ? 'Final' : match.status === 'in_progress' ? 'In progress' : formatDate(match.scheduledAt, { year: undefined })}
      </p>
    </Link>
  );
}
