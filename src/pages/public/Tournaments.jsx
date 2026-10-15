import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, LayoutGrid, List, SlidersHorizontal, Gamepad2, X } from 'lucide-react';
import { PageHeader } from '../../components/ui/SectionHeading.jsx';
import Tabs from '../../components/ui/Tabs.jsx';
import { Input, Select } from '../../components/ui/Field.jsx';
import Button from '../../components/ui/Button.jsx';
import { CardSkeleton, EmptyState, ErrorState } from '../../components/ui/States.jsx';
import TournamentCard from '../../components/tournaments/TournamentCard.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useDebounce, useDocumentTitle } from '../../hooks/index.js';
import { GAME_LIST, FORMAT_LIST } from '../../lib/constants.js';
import { filterTournaments, SORTS } from '../../utils/tournamentFilters.js';
import { publicTournaments } from '../../utils/selectors.js';
import { cn } from '../../utils/format.js';

const PAGE = 9;
const DEFAULTS = { game: 'all', status: 'all', format: 'all', fee: 'all', sort: 'date', view: 'grid', q: '' };

export default function Tournaments() {
  useDocumentTitle('Tournaments');
  const { db, loading, error, refresh } = useData();
  const [params, setParams] = useSearchParams();
  const [limit, setLimit] = useState(PAGE);
  const [showFilters, setShowFilters] = useState(false);
  const f = Object.fromEntries(Object.keys(DEFAULTS).map((k) => [k, params.get(k) ?? DEFAULTS[k]]));
  const [q, setQ] = useState(f.q);
  const debounced = useDebounce(q);

  const set = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === DEFAULTS[key] || value === '') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
    setLimit(PAGE);
  };

  const filterKey = params.toString();
  const list = useMemo(() => filterTournaments(publicTournaments(db), { ...f, q: debounced }, db.registrations), [db, filterKey, debounced]); // f derives from params
  const activeFilters = ['game', 'status', 'format', 'fee'].filter((k) => f[k] !== DEFAULTS[k]).length + (debounced ? 1 : 0);
  const clear = () => {
    setQ('');
    setParams(f.view !== 'grid' ? { view: f.view } : {}, { replace: true });
  };

  return (
    <>
      <PageHeader eyebrow="// Tournaments" title="Find your next battle" description="Browse every tournament across BGMI, Valorant, Free Fire and Mini Militia. Filter by status, format and entry fee." />
      <div className="container-page py-10">
        <div className="mb-6 flex flex-col gap-4">
          <Tabs value={f.game} onChange={(v) => set('game', v)} options={[{ value: 'all', label: 'All Games' }, ...GAME_LIST.map((g) => ({ value: g.id, label: g.name }))]} ariaLabel="Filter by game" />
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <Input
              icon={Search}
              placeholder="Search by tournament name"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                set('q', e.target.value);
              }}
              aria-label="Search tournaments"
              className="md:flex-1"
            />
            <div className="flex gap-2">
              <Button variant="secondary" className="md:hidden" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
                <SlidersHorizontal className="h-4 w-4" /> Filters {activeFilters > 0 && <span className="rounded bg-lime px-1.5 text-xs text-ink-950">{activeFilters}</span>}
              </Button>
              <Select value={f.sort} onChange={(e) => set('sort', e.target.value)} aria-label="Sort by" options={Object.entries(SORTS).map(([value, label]) => ({ value, label: `Sort: ${label}` }))} className="flex-1 md:w-52" />
              <div className="flex rounded-xl border border-white/10 bg-ink-850 p-1" role="group" aria-label="View mode">
                {[
                  ['grid', LayoutGrid],
                  ['list', List],
                ].map(([v, Icon]) => (
                  <button key={v} onClick={() => set('view', v)} aria-pressed={f.view === v} aria-label={`${v} view`} className={cn('rounded-lg p-2', f.view === v ? 'bg-lime text-ink-950' : 'text-mist-400 hover:text-mist-100')}>
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className={cn('grid gap-3 sm:grid-cols-3', showFilters ? 'grid' : 'hidden md:grid')}>
            <Select
              label="Status"
              value={f.status}
              onChange={(e) => set('status', e.target.value)}
              options={[
                { value: 'all', label: 'Any status' },
                { value: 'open', label: 'Registration open' },
                { value: 'upcoming', label: 'Upcoming' },
                { value: 'ongoing', label: 'In progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
            <Select label="Format" value={f.format} onChange={(e) => set('format', e.target.value)} options={[{ value: 'all', label: 'Any format' }, ...FORMAT_LIST.map((x) => ({ value: x.id, label: x.label }))]} />
            <Select
              label="Entry fee"
              value={f.fee}
              onChange={(e) => set('fee', e.target.value)}
              options={[
                { value: 'all', label: 'Any fee' },
                { value: 'free', label: 'Free entry' },
                { value: 'paid', label: 'Paid entry' },
              ]}
            />
          </div>
        </div>

        <div className="mb-5 flex items-center justify-between text-sm text-mist-400">
          <p aria-live="polite">
            {loading ? 'Loading…' : `${list.length} tournament${list.length === 1 ? '' : 's'}`}
          </p>
          {activeFilters > 0 && (
            <button onClick={clear} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-mist-300 hover:bg-white/5 hover:text-lime">
              <X className="h-3.5 w-3.5" /> Clear filters
            </button>
          )}
        </div>

        {error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <CardSkeleton count={6} />
          </div>
        ) : list.length === 0 ? (
          <EmptyState icon={Gamepad2} title="No tournaments found" message="Nothing matches those filters yet. Try widening your search." action={<Button variant="secondary" size="sm" onClick={clear}>Clear filters</Button>} />
        ) : (
          <motion.div layout className={f.view === 'grid' ? 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-3'}>
            <AnimatePresence mode="popLayout">
              {list.slice(0, limit).map((t) => (
                <TournamentCard key={t.id} tournament={t} registrations={db.registrations} view={f.view} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {list.length > limit && (
          <div className="mt-10 text-center">
            <Button variant="secondary" onClick={() => setLimit((l) => l + PAGE)}>
              Load more ({list.length - limit} remaining)
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
