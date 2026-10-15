import { Link, useParams } from 'react-router-dom';
import { Pencil, GraduationCap, Gamepad2, Trophy, Crown, Swords, Shield, Flame, Zap, History } from 'lucide-react';
import { Avatar, TeamLogo } from '../../components/ui/Avatar.jsx';
import { GameChip } from '../../components/ui/GameArt.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import PageFallback from '../../components/ui/PageFallback.jsx';
import { EmptyState, ErrorState } from '../../components/ui/States.jsx';
import NotFound from './NotFound.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDocumentTitle } from '../../hooks/index.js';
import { GAMES } from '../../lib/constants.js';
import { playerStats, achievementsFor, matchHistoryForPlayer, teamsForUser, byId } from '../../utils/selectors.js';
import { formatDate, percent, cn } from '../../utils/format.js';

const ACH_ICONS = { trophy: Trophy, crown: Crown, swords: Swords, shield: Shield, flame: Flame, zap: Zap };

export default function PlayerProfile() {
  const { username } = useParams();
  const { db, loading, error, refresh } = useData();
  const { userId } = useAuth();
  const profile = db.profiles.find((p) => p.username.toLowerCase() === username?.toLowerCase());
  useDocumentTitle(profile?.username ?? 'Player');

  if (loading) return <PageFallback />;
  if (error) return <div className="container-page pt-32"><ErrorState message={error} onRetry={refresh} /></div>;
  if (!profile) return <NotFound what="player" />;

  return <ProfileView db={db} profile={profile} isSelf={profile.id === userId} />;
}

export function ProfileView({ db, profile, isSelf }) {
  const stats = playerStats(db, profile.id);
  const achievements = achievementsFor(db, profile.id);
  const history = matchHistoryForPlayer(db, profile.id).slice(0, 10);
  const teams = teamsForUser(db, profile.id);
  const ids = Object.entries(profile.gameIds ?? {}).filter(([, v]) => v);

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/5 pt-20">
        <div className="absolute inset-0 opacity-50" style={{ background: `radial-gradient(ellipse at 15% 0%, ${profile.avatarColor ?? '#8B5CF6'}35, transparent 60%)` }} aria-hidden />
        <div className="bg-grid mask-fade-b absolute inset-0 opacity-50" aria-hidden />
        <div className="container-page relative py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            <Avatar profile={profile} size="xl" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-4xl font-bold sm:text-5xl">{profile.username}</h1>
                {profile.role === 'admin' && <Badge tone="violet">Admin</Badge>}
              </div>
              <p className="mt-1 text-lg text-mist-300">{profile.displayName}</p>
              <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-mist-400">
                <span className="inline-flex items-center gap-1.5"><GraduationCap className="h-4 w-4" /> {profile.college}</span>
                {profile.favoriteGame && <span className="inline-flex items-center gap-1.5"><Gamepad2 className="h-4 w-4" /> Favourite: {GAMES[profile.favoriteGame]?.name}</span>}
              </p>
              {profile.bio && <p className="mt-3 max-w-2xl text-sm text-mist-300">{profile.bio}</p>}
            </div>
            {isSelf && (
              <Button to="/profile/edit" variant="secondary">
                <Pencil className="h-4 w-4" /> Edit profile
              </Button>
            )}
          </div>
          <dl className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {[
              ['Rank', stats.rank ? `#${stats.rank}` : '—'],
              ['Matches', stats.played],
              ['Wins', stats.wins],
              ['Losses', stats.losses],
              ['Win rate', percent(stats.winRate)],
              ['Tournaments', stats.tournaments],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-white/[0.07] bg-ink-900/60 p-3">
                <dt className="text-[11px] uppercase tracking-wider text-mist-500">{k}</dt>
                <dd className={cn('font-display text-2xl font-bold tabular', k === 'Rank' ? 'text-lime' : 'text-mist-100')}>{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-xs text-mist-500">Overall player ranking in circuit points, credited from team results.</p>
        </div>
      </section>

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="ach-title">
            <h2 id="ach-title" className="mb-4 text-xl font-semibold uppercase">Achievements</h2>
            {achievements.length ? (
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {achievements.map((a) => {
                  const Icon = ACH_ICONS[a.icon] ?? Trophy;
                  return (
                    <li key={a.id} className="surface flex items-center gap-3 p-4">
                      <span className="clip-corner-sm flex h-11 w-11 shrink-0 items-center justify-center bg-lime/10 text-lime">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="font-display font-semibold text-mist-100">{a.title}</p>
                        <p className="truncate text-xs text-mist-400">{a.detail}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState title="No achievements yet" message="Achievements unlock automatically from match results and titles." />
            )}
          </section>
          <section aria-labelledby="hist-title">
            <h2 id="hist-title" className="mb-4 flex items-center gap-2 text-xl font-semibold uppercase"><History className="h-5 w-5 text-lime" /> Match history</h2>
            {history.length ? (
              <div className="surface divide-y divide-white/5">
                {history.map(({ match, teamId, result }) => {
                  const t = byId(db.tournaments, match.tournamentId);
                  const team = byId(db.teams, teamId);
                  const opp = match.participants.length === 2 ? byId(db.teams, match.participants.find((p) => p !== teamId)) : null;
                  const won = result?.isWinner;
                  return (
                    <Link key={match.id} to={`/matches/${match.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-white/[0.02]">
                      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-display text-sm font-bold', won ? 'bg-lime/15 text-lime' : 'bg-danger/10 text-danger')}>{won ? 'W' : 'L'}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-mist-100">
                          {team?.name} {opp ? <>vs {opp.name}</> : <>· placed #{result?.placement} ({result?.kills} kills)</>}
                        </p>
                        <p className="truncate text-xs text-mist-500">{t?.name} · {match.round}</p>
                      </div>
                      {opp && <span className="font-mono text-sm tabular text-mist-300">{result?.score}–{db.results.find((r) => r.matchId === match.id && r.teamId === opp.id)?.score}</span>}
                      <span className="text-xs text-mist-500">{formatDate(match.scheduledAt, { year: undefined })}</span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="No matches played" message="Completed matches will appear here." />
            )}
          </section>
        </div>
        <aside className="space-y-5">
          <section className="surface p-5" aria-labelledby="teams-title">
            <h2 id="teams-title" className="mb-4 text-lg font-semibold uppercase">Teams</h2>
            {teams.length ? (
              <ul className="space-y-2">
                {teams.map((t) => (
                  <li key={t.id}>
                    <Link to={`/teams/${t.id}`} className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-white/[0.03]">
                      <TeamLogo team={t} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-mist-100">{t.name}</span>
                      {t.captainId === profile.id && <Crown className="h-4 w-4 text-lime" aria-label="Captain" />}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-mist-500">Not on a team yet.</p>
            )}
          </section>
          <section className="surface p-5" aria-labelledby="ids-title">
            <h2 id="ids-title" className="mb-4 text-lg font-semibold uppercase">Gaming IDs</h2>
            {ids.length ? (
              <dl className="space-y-2.5">
                {ids.map(([g, v]) => (
                  <div key={g} className="flex items-center justify-between gap-3">
                    <dt><GameChip game={g} /></dt>
                    <dd className="truncate font-mono text-sm text-mist-100">{v}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-mist-500">No gaming IDs added.</p>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
