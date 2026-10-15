import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, List, CalendarClock, X } from 'lucide-react';
import { PageHeader } from '../../components/ui/SectionHeading.jsx';
import Tabs from '../../components/ui/Tabs.jsx';
import { Select } from '../../components/ui/Field.jsx';
import { CardSkeleton, EmptyState, ErrorState } from '../../components/ui/States.jsx';
import MatchCard from '../../components/matches/MatchCard.jsx';
import MatchCalendar from '../../components/matches/MatchCalendar.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useDocumentTitle } from '../../hooks/index.js';
import { GAME_LIST, TIMEZONE_LABEL } from '../../lib/constants.js';
import { byId, publicTournaments } from '../../utils/selectors.js';
import { dayKey, formatDate } from '../../utils/format.js';

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'scheduled', label: 'Upcoming' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
];

export default function Matches() {
  useDocumentTitle('Match Schedule');
  const { db, loading, error, refresh } = useData();
  const [params, setParams] = useSearchParams();
  const view = params.get('view') ?? 'list';
  const status = params.get('status') ?? 'all';
  const game = params.get('game') ?? 'all';
  const tournamentId = params.get('tournament') ?? '';
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [day, setDay] = useState(null);

  const set = (key, value) => {
    const next = new URLSearchParams(params);
    if (!value || value === 'all' || (key === 'view' && value === 'list')) next.delete(key);
    else next.set(key, value);
    if (key === 'game') next.delete('tournament');
    setParams(next, { replace: true });
  };

  const visible = useMemo(() => {
    const ok = new Set(publicTournaments(db).map((t) => t.id));
    return db.matches
      .filter((m) => ok.has(m.tournamentId))
      .filter((m) => status === 'all' || m.status === status)
      .filter((m) => game === 'all' || byId(db.tournaments, m.tournamentId)?.game === game)
      .filter((m) => !tournamentId || m.tournamentId === tournamentId);
  }, [db, status, game, tournamentId]);

  // Upcoming/in-progress ascending, completed most-recent first
  const sorted = useMemo(() => {
    const live = visible.filter((m) => m.status !== 'completed').sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    const done = visible.filter((m) => m.status === 'completed').sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));
    return [...live, ...done];
  }, [visible]);

  const listForView = view === 'calendar' && day ? sorted.filter((m) => dayKey(m.scheduledAt) === day) : sorted;
  const groups = [];
  for (const m of listForView) {
    const k = dayKey(m.scheduledAt);
    let g = groups.find((x) => x.key === k);
    if (!g) groups.push((g = { key: k, label: formatDate(m.scheduledAt, { weekday: 'long' }), matches: [] }));
    g.matches.push(m);
  }
  const tournaments = publicTournaments(db).filter((t) => game === 'all' || t.game === game);

  return (
    <>
      <PageHeader eyebrow="// Schedule" title="Match Schedule" description={`All times in ${TIMEZONE_LABEL} (UTC+5:30). Results are published by tournament admins after each match.`} />
      <div className="container-page py-10">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap gap-3">
            <Tabs value={status} onChange={(v) => set('status', v)} options={STATUS_TABS} ariaLabel="Match status" />
            <Tabs
              value={view}
              onChange={(v) => {
                set('view', v);
                setDay(null);
              }}
              ariaLabel="View"
              options={[
                { value: 'list', label: 'List', icon: List },
                { value: 'calendar', label: 'Calendar', icon: CalendarDays },
              ]}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[480px]">
            <Select label="Game" value={game} onChange={(e) => set('game', e.target.value)} options={[{ value: 'all', label: 'All games' }, ...GAME_LIST.map((g) => ({ value: g.id, label: g.name }))]} />
            <Select label="Tournament" value={tournamentId} onChange={(e) => set('tournament', e.target.value)} options={[{ value: '', label: 'All tournaments' }, ...tournaments.map((t) => ({ value: t.id, label: t.name }))]} />
          </div>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <CardSkeleton count={6} className="h-48" />
          </div>
        ) : (
          <div className={view === 'calendar' ? 'grid gap-6 lg:grid-cols-[420px_1fr]' : ''}>
            {view === 'calendar' && (
              <div className="lg:sticky lg:top-24 lg:self-start">
                <MatchCalendar month={month} onMonth={setMonth} matches={visible} db={db} selected={day} onSelect={setDay} />
                {day && (
                  <button onClick={() => setDay(null)} className="mt-3 inline-flex items-center gap-1 text-sm text-mist-300 hover:text-lime">
                    <X className="h-4 w-4" /> Show all dates
                  </button>
                )}
              </div>
            )}
            <div className="min-w-0">
              {groups.length === 0 ? (
                <EmptyState icon={CalendarClock} title={day ? 'No matches on this day' : 'No matches found'} message="Try a different filter or date." />
              ) : (
                <div className="space-y-8">
                  {groups.map((g) => (
                    <section key={g.key} aria-label={g.label}>
                      <h2 className="mb-3 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-mist-400">
                        {g.label}
                        {g.key === dayKey(new Date().toISOString()) && <span className="rounded bg-cyan/15 px-1.5 py-0.5 text-cyan">Today</span>}
                        <span className="h-px flex-1 bg-white/5" />
                      </h2>
                      <div className={view === 'calendar' ? 'grid gap-4 xl:grid-cols-2' : 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'}>
                        {g.matches.map((m) => (
                          <MatchCard key={m.id} match={m} db={db} />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
