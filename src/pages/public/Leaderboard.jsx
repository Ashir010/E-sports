import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Trophy, Info, Users, User } from 'lucide-react';
import { PageHeader } from '../../components/ui/SectionHeading.jsx';
import Tabs from '../../components/ui/Tabs.jsx';
import { Input, Select } from '../../components/ui/Field.jsx';
import { RowSkeleton, EmptyState, ErrorState } from '../../components/ui/States.jsx';
import Podium from '../../components/leaderboard/Podium.jsx';
import LeaderboardTable from '../../components/leaderboard/LeaderboardTable.jsx';
import PerformanceCharts from '../../components/leaderboard/PerformanceCharts.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useDebounce, useDocumentTitle } from '../../hooks/index.js';
import { GAME_LIST } from '../../lib/constants.js';
import { isDemoMode } from '../../services/api.js';
import { withMovement, computePlayerStandings, describeRules, rulesFor, CIRCUIT_DESCRIPTION } from '../../utils/scoring.js';
import { byId, publicTournaments } from '../../utils/selectors.js';

export default function Leaderboard() {
  useDocumentTitle('Leaderboard');
  const { db, loading, error, refresh } = useData();
  const [params, setParams] = useSearchParams();
  const kind = params.get('view') ?? 'team';
  const game = params.get('game') ?? 'all';
  const tournamentId = params.get('tournament') ?? '';
  const [q, setQ] = useState('');
  const debounced = useDebounce(q).trim().toLowerCase();

  const set = (key, value) => {
    const next = new URLSearchParams(params);
    if (!value || value === 'all' || (key === 'view' && value === 'team')) next.delete(key);
    else next.set(key, value);
    if (key === 'game') next.delete('tournament');
    setParams(next, { replace: true });
  };

  const filter = useMemo(() => (tournamentId ? { tournamentId } : game !== 'all' ? { game } : {}), [tournamentId, game]);
  const teamRows = useMemo(() => withMovement(db, filter), [db, filter]);
  const playerRows = useMemo(() => computePlayerStandings(db, filter), [db, filter]);
  const rows = kind === 'team' ? teamRows : playerRows;
  const searched = debounced
    ? rows.filter((r) => {
        if (kind === 'team') return r.name.toLowerCase().includes(debounced) || byId(db.teams, r.teamId)?.college.toLowerCase().includes(debounced);
        const p = byId(db.profiles, r.profileId);
        return p?.username.toLowerCase().includes(debounced) || p?.displayName.toLowerCase().includes(debounced);
      })
    : rows;

  const tournaments = publicTournaments(db).filter((t) => (game === 'all' || t.game === game) && db.matches.some((m) => m.tournamentId === t.id && m.status === 'completed'));
  const tournament = byId(db.tournaments, tournamentId);
  const scoringNote = tournament ? describeRules(rulesFor(tournament)) : game !== 'all' ? describeRules(rulesFor({ game })) : CIRCUIT_DESCRIPTION;

  return (
    <>
      <PageHeader eyebrow="// Rankings" title="Leaderboard" description="Every rank is calculated from stored match results and each tournament’s scoring rules — nothing is edited by hand." />
      <div className="container-page space-y-8 py-10">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Tabs
              value={kind}
              onChange={(v) => set('view', v)}
              ariaLabel="Ranking type"
              options={[
                { value: 'team', label: 'Teams', icon: Users },
                { value: 'player', label: 'Players', icon: User },
              ]}
            />
            <Tabs value={game} onChange={(v) => set('game', v)} ariaLabel="Game" size="sm" options={[{ value: 'all', label: 'Overall' }, ...GAME_LIST.map((g) => ({ value: g.id, label: g.name }))]} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Tournament standings"
              value={tournamentId}
              onChange={(e) => set('tournament', e.target.value)}
              options={[{ value: '', label: game === 'all' ? 'All tournaments' : `All ${GAME_LIST.find((g) => g.id === game).name} tournaments` }, ...tournaments.map((t) => ({ value: t.id, label: t.name }))]}
            />
            <Input label="Search" icon={Search} placeholder={kind === 'team' ? 'Team or college' : 'Player name'} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <p className="flex items-start gap-2 rounded-xl border border-white/[0.07] bg-ink-850 px-4 py-3 text-xs text-mist-400">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan" aria-hidden />
            <span>
              <strong className="text-mist-200">Scoring: </strong>
              {scoringNote}
              {kind === 'player' && ' Players are credited with their team’s results.'} Movement compares against standings before the latest match day.
              {isDemoMode && <span className="ml-1 text-warn">Showing demo data.</span>}
            </span>
          </p>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : loading ? (
          <RowSkeleton rows={8} />
        ) : rows.length === 0 ? (
          <EmptyState icon={Trophy} title="No rankings yet" message="Rankings appear once results are posted for this selection." />
        ) : (
          <>
            {!debounced && <Podium rows={rows} db={db} kind={kind} />}
            {searched.length ? <LeaderboardTable rows={searched} db={db} kind={kind} /> : <EmptyState icon={Search} title="No matches for your search" />}
            {kind === 'team' && !debounced && <PerformanceCharts db={db} rows={teamRows} filter={filter} />}
          </>
        )}
      </div>
    </>
  );
}
