import { Input } from '../ui/Field.jsx';
import { TeamLogo } from '../ui/Avatar.jsx';
import { byId } from '../../utils/selectors.js';

/** Builds the initial result rows for a match (existing results or blanks). */
export function initialResults(db, match) {
  return match.participants.map((teamId) => {
    const r = db.results.find((x) => x.matchId === match.id && x.teamId === teamId);
    return { teamId, score: r?.score ?? '', placement: r?.placement ?? '', kills: r?.kills ?? '' };
  });
}

/** Validates and normalises result rows. Returns { errors, results }. */
export function buildResults(rows, type) {
  const errors = [];
  if (type === 'br') {
    const placements = rows.map((r) => Number(r.placement));
    if (placements.some((p) => !Number.isInteger(p) || p < 1 || p > rows.length)) errors.push(`Placements must be whole numbers from 1 to ${rows.length}.`);
    if (new Set(placements).size !== placements.length) errors.push('Each team needs a unique placement.');
    if (rows.some((r) => r.kills === '' || Number(r.kills) < 0)) errors.push('Enter kills (0 or more) for every team.');
    return { errors, results: rows.map((r) => ({ teamId: r.teamId, placement: Number(r.placement), kills: Number(r.kills), isWinner: Number(r.placement) === 1 })) };
  }
  if (rows.some((r) => r.score === '' || Number(r.score) < 0 || !Number.isInteger(Number(r.score)))) errors.push('Enter a whole-number score (0 or more) for each team.');
  const max = Math.max(...rows.map((r) => Number(r.score)));
  const leaders = rows.filter((r) => Number(r.score) === max);
  return { errors, results: rows.map((r) => ({ teamId: r.teamId, score: Number(r.score), isWinner: leaders.length === 1 && Number(r.score) === max })) };
}

export default function ResultForm({ db, rows, setRows, type }) {
  const set = (i, k, v) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_90px_90px] gap-2 px-1 font-mono text-[10px] uppercase tracking-wider text-mist-500">
        <span>Team</span>
        {type === 'br' ? (
          <>
            <span>Placement</span>
            <span>Kills</span>
          </>
        ) : (
          <>
            <span className="col-span-2">Score (rounds / kills)</span>
          </>
        )}
      </div>
      {rows.map((r, i) => {
        const team = byId(db.teams, r.teamId);
        return (
          <div key={r.teamId} className="grid grid-cols-[1fr_90px_90px] items-center gap-2 rounded-xl bg-ink-850 p-2">
            <span className="flex min-w-0 items-center gap-2">
              <TeamLogo team={team} size="sm" />
              <span className="truncate text-sm text-mist-100">{team?.name}</span>
            </span>
            {type === 'br' ? (
              <>
                <Input aria-label={`${team?.name} placement`} type="number" min={1} max={rows.length} value={r.placement} onChange={(e) => set(i, 'placement', e.target.value)} />
                <Input aria-label={`${team?.name} kills`} type="number" min={0} value={r.kills} onChange={(e) => set(i, 'kills', e.target.value)} />
              </>
            ) : (
              <Input aria-label={`${team?.name} score`} type="number" min={0} value={r.score} onChange={(e) => set(i, 'score', e.target.value)} className="col-span-2" />
            )}
          </div>
        );
      })}
      {type !== 'br' && <p className="pt-1 text-xs text-mist-500">The higher score wins. Equal scores are recorded as a draw.</p>}
    </div>
  );
}
