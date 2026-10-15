import { ChevronLeft, ChevronRight } from 'lucide-react';
import { GAMES } from '../../lib/constants.js';
import { dayKey, cn } from '../../utils/format.js';
import { byId } from '../../utils/selectors.js';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Month grid (IST). `month` is a Date at the 1st of the month (local values used as IST calendar). */
export default function MatchCalendar({ month, onMonth, matches, db, selected, onSelect }) {
  const y = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(y, m, 1);
  const offset = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((offset + daysInMonth) / 7) * 7 }, (_, i) => {
    const d = i - offset + 1;
    return d >= 1 && d <= daysInMonth ? d : null;
  });
  const key = (d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const byDay = new Map();
  matches.forEach((mt) => {
    const k = dayKey(mt.scheduledAt);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k).push(mt);
  });
  const today = dayKey(new Date().toISOString());
  const label = first.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="surface p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold uppercase" aria-live="polite">{label}</h2>
        <div className="flex gap-1">
          <button onClick={() => onMonth(new Date(y, m - 1, 1))} className="rounded-lg p-2 text-mist-300 hover:bg-white/5" aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => onMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))} className="rounded-lg px-3 text-xs text-mist-300 hover:bg-white/5">
            Today
          </button>
          <button onClick={() => onMonth(new Date(y, m + 1, 1))} className="rounded-lg p-2 text-mist-300 hover:bg-white/5" aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center" role="grid" aria-label={`Match calendar, ${label}`}>
        {WEEKDAYS.map((w) => (
          <div key={w} className="pb-2 font-mono text-[10px] uppercase tracking-wider text-mist-500" role="columnheader">
            {w}
          </div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={i} aria-hidden />;
          const k = key(d);
          const list = byDay.get(k) ?? [];
          const isSel = selected === k;
          return (
            <button
              key={i}
              role="gridcell"
              aria-selected={isSel}
              aria-label={`${d} ${label}: ${list.length} match${list.length === 1 ? '' : 'es'}`}
              onClick={() => onSelect(isSel ? null : k)}
              className={cn(
                'flex aspect-square flex-col items-center justify-start rounded-lg border p-1 text-sm transition sm:aspect-[1.3] sm:p-1.5',
                isSel ? 'border-lime bg-lime/10 text-lime' : list.length ? 'border-white/10 bg-ink-850 text-mist-100 hover:border-white/25' : 'border-transparent text-mist-500 hover:bg-white/[0.03]',
                k === today && !isSel && 'ring-1 ring-cyan/50'
              )}
            >
              <span className="tabular">{d}</span>
              {list.length > 0 && (
                <span className="mt-auto flex flex-wrap justify-center gap-0.5">
                  {list.slice(0, 4).map((mt) => (
                    <span key={mt.id} className="h-1.5 w-1.5 rounded-full" style={{ background: GAMES[byId(db.tournaments, mt.tournamentId)?.game]?.color }} aria-hidden />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
