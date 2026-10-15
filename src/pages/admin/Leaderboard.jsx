import { useMemo, useState } from 'react';
import { RefreshCw, Info, Trophy } from 'lucide-react';
import { AdminHeader } from '../../layouts/AdminLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import { Select } from '../../components/ui/Field.jsx';
import { EmptyState, RowSkeleton } from '../../components/ui/States.jsx';
import LeaderboardTable from '../../components/leaderboard/LeaderboardTable.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/index.js';
import { withMovement, describeRules, rulesFor, CIRCUIT_DESCRIPTION } from '../../utils/scoring.js';
import { byId } from '../../utils/selectors.js';

export default function AdminLeaderboard() {
  useDocumentTitle('Admin · Leaderboard');
  const { db, loading, refresh } = useData();
  const toast = useToast();
  const [tournamentId, setTournamentId] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const rows = useMemo(() => withMovement(db, tournamentId ? { tournamentId } : {}), [db, tournamentId]);
  const t = byId(db.tournaments, tournamentId);

  const regenerate = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
    toast.success('Standings regenerated from the latest stored results.');
  };

  return (
    <>
      <AdminHeader title="Leaderboard" description="Standings are generated from match results and each tournament’s scoring rules — they cannot be edited directly.">
        <Button size="sm" variant="secondary" onClick={regenerate} loading={refreshing}>
          <RefreshCw className="h-4 w-4" /> Regenerate standings
        </Button>
      </AdminHeader>
      <div className="mb-4 grid gap-3 lg:grid-cols-[320px_1fr] lg:items-center">
        <Select aria-label="Tournament" value={tournamentId} onChange={(e) => setTournamentId(e.target.value)} options={[{ value: '', label: 'Overall (circuit points)' }, ...db.tournaments.filter((x) => x.status !== 'draft').map((x) => ({ value: x.id, label: x.name }))]} />
        <p className="flex items-start gap-2 text-xs text-mist-400">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
          {t ? describeRules(rulesFor(t)) : CIRCUIT_DESCRIPTION} To change a ranking, correct the match result under Matches.
        </p>
      </div>
      {loading ? <RowSkeleton /> : rows.length ? <LeaderboardTable rows={rows} db={db} /> : <EmptyState icon={Trophy} title="No results yet" message="Enter match results to generate standings." />}
    </>
  );
}
