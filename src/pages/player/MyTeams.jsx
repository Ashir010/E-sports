import { Link } from 'react-router-dom';
import { Plus, KeyRound, Crown, Users, Settings } from 'lucide-react';
import { PageHeader } from '../../components/ui/SectionHeading.jsx';
import Button from '../../components/ui/Button.jsx';
import { TeamLogo, Avatar } from '../../components/ui/Avatar.jsx';
import { GameChip } from '../../components/ui/GameArt.jsx';
import { RegStatusBadge } from '../../components/ui/Badge.jsx';
import { EmptyState } from '../../components/ui/States.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useDocumentTitle } from '../../hooks/index.js';
import { GAMES } from '../../lib/constants.js';
import { teamsForUser, teamMembers, byId } from '../../utils/selectors.js';
import { rosterLimits } from '../../utils/registrationRules.js';

export default function MyTeams() {
  useDocumentTitle('My teams');
  const { userId } = useAuth();
  const { db } = useData();
  const teams = teamsForUser(db, userId);

  return (
    <>
      <PageHeader eyebrow="// Squads" title="My teams" description="Teams you captain or play for. Captains can edit details, invite players and register for tournaments.">
        <div className="flex flex-wrap gap-3">
          <Button to="/teams/create"><Plus className="h-4 w-4" /> Create team</Button>
          <Button to="/teams/join" variant="secondary"><KeyRound className="h-4 w-4" /> Join with code</Button>
        </div>
      </PageHeader>
      <div className="container-page py-10">
        {teams.length === 0 ? (
          <EmptyState icon={Users} title="No teams yet" message="Create a team and invite your friends, or join an existing team with an invite code." action={<Button to="/teams/create" size="sm">Create your first team</Button>} />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {teams.map((t) => {
              const members = teamMembers(db, t.id);
              const { min, max } = rosterLimits(GAMES[t.game].defaultFormat);
              const regs = db.registrations.filter((r) => r.teamId === t.id && r.status !== 'withdrawn').slice(-3);
              const captain = t.captainId === userId;
              return (
                <article key={t.id} className="surface flex flex-col p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <TeamLogo team={t} size="lg" />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-xl font-bold">
                        <Link to={`/teams/${t.id}`} className="hover:text-lime">{t.name}</Link>
                      </h2>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-mist-400">
                        <GameChip game={t.game} />
                        {captain ? <span className="inline-flex items-center gap-1 text-lime"><Crown className="h-3.5 w-3.5" /> Captain</span> : <span>Player</span>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {members.map((m) => <Avatar key={m.id} profile={m.profile} size="sm" className="ring-2 ring-ink-800" />)}
                    </div>
                    <span className={`font-mono text-xs ${members.length < min ? 'text-warn' : 'text-mist-400'}`}>
                      {members.length}/{max} players{members.length < min ? ` · need ${min - members.length}` : ''}
                    </span>
                  </div>
                  {regs.length > 0 && (
                    <ul className="mt-4 space-y-1.5 border-t border-white/5 pt-4">
                      {regs.map((r) => (
                        <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                          <Link to={`/tournaments/${r.tournamentId}`} className="truncate text-mist-300 hover:text-lime">{byId(db.tournaments, r.tournamentId)?.name}</Link>
                          <RegStatusBadge status={r.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-auto flex gap-2 pt-5">
                    <Button to={`/teams/${t.id}/manage`} size="sm" variant={captain ? 'primary' : 'secondary'} className="flex-1">
                      <Settings className="h-4 w-4" /> {captain ? 'Manage team' : 'View roster'}
                    </Button>
                    {captain && (
                      <Button to={`/tournaments?game=${t.game}&status=open`} size="sm" variant="secondary" className="flex-1">
                        Register
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
