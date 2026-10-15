import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, Plus, KeyRound } from 'lucide-react';
import { PageHeader } from '../../components/ui/SectionHeading.jsx';
import Tabs from '../../components/ui/Tabs.jsx';
import { Input } from '../../components/ui/Field.jsx';
import Button from '../../components/ui/Button.jsx';
import { CardSkeleton, EmptyState, ErrorState } from '../../components/ui/States.jsx';
import { TeamLogo, Avatar } from '../../components/ui/Avatar.jsx';
import { GameChip } from '../../components/ui/GameArt.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useDebounce, useDocumentTitle } from '../../hooks/index.js';
import { GAME_LIST } from '../../lib/constants.js';
import { computeStandings } from '../../utils/scoring.js';
import { teamMembers } from '../../utils/selectors.js';
import { percent } from '../../utils/format.js';

export default function Teams() {
  useDocumentTitle('Teams');
  const { db, loading, error, refresh } = useData();
  const [game, setGame] = useState('all');
  const [q, setQ] = useState('');
  const debounced = useDebounce(q).trim().toLowerCase();
  const stats = useMemo(() => new Map(GAME_LIST.flatMap((g) => computeStandings(db, { game: g.id }).map((r) => [r.teamId, r]))), [db]);

  const teams = db.teams
    .filter((t) => game === 'all' || t.game === game)
    .filter((t) => !debounced || t.name.toLowerCase().includes(debounced) || t.college.toLowerCase().includes(debounced) || t.tag.toLowerCase().includes(debounced))
    .sort((a, b) => (stats.get(a.id)?.rank ?? 999) - (stats.get(b.id)?.rank ?? 999) || a.name.localeCompare(b.name));

  return (
    <>
      <PageHeader eyebrow="// Teams" title="Teams" description="Every registered squad on the platform. Find rivals, scout rosters, or start your own.">
        <div className="flex flex-wrap gap-3">
          <Button to="/teams/create"><Plus className="h-4 w-4" /> Create a team</Button>
          <Button to="/teams/join" variant="secondary"><KeyRound className="h-4 w-4" /> Join with invite code</Button>
        </div>
      </PageHeader>
      <div className="container-page py-10">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Tabs value={game} onChange={setGame} ariaLabel="Filter by game" options={[{ value: 'all', label: 'All', count: db.teams.length }, ...GAME_LIST.map((g) => ({ value: g.id, label: g.name, count: db.teams.filter((t) => t.game === g.id).length }))]} />
          <Input icon={Search} placeholder="Team, tag or college" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search teams" className="md:w-72" />
        </div>
        {error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CardSkeleton count={6} className="h-52" />
          </div>
        ) : teams.length === 0 ? (
          <EmptyState icon={Users} title="No teams found" message="Try a different search, or create the first one." action={<Button to="/teams/create" size="sm">Create a team</Button>} />
        ) : (
          <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {teams.map((t) => {
                const s = stats.get(t.id);
                const members = teamMembers(db, t.id);
                return (
                  <motion.div key={t.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} className="min-w-0">
                    <Link to={`/teams/${t.id}`} className="surface surface-hover group flex h-full flex-col p-5">
                      <div className="flex items-start gap-4">
                        <TeamLogo team={t} size="lg" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-lg font-bold text-mist-100 group-hover:text-lime">{t.name}</p>
                          <p className="truncate text-xs text-mist-500">{t.college}</p>
                          <GameChip game={t.game} className="mt-1.5" />
                        </div>
                        {s && <span className="font-display text-2xl font-bold text-white/15">#{s.rank}</span>}
                      </div>
                      <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
                        <div className="flex -space-x-2">
                          {members.slice(0, 5).map((m) => (
                            <Avatar key={m.id} profile={m.profile} size="sm" className="ring-2 ring-ink-800" />
                          ))}
                        </div>
                        <p className="text-xs text-mist-400">{s ? `${s.wins}W · ${percent(s.winRate)} win rate` : 'No matches yet'}</p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </>
  );
}
