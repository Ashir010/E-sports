import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Ticket, Users, CalendarDays, Clock, Gamepad2, MonitorPlay, ListChecks, ScrollText, Medal, CalendarClock, Award } from 'lucide-react';
import GameArt from '../../components/ui/GameArt.jsx';
import { TournamentStatusBadge, RegStatusBadge } from '../../components/ui/Badge.jsx';
import Tabs from '../../components/ui/Tabs.jsx';
import { EmptyState, ErrorState } from '../../components/ui/States.jsx';
import { TeamLogo } from '../../components/ui/Avatar.jsx';
import PageFallback from '../../components/ui/PageFallback.jsx';
import RegisterPanel from '../../components/tournaments/RegisterPanel.jsx';
import Bracket from '../../components/tournaments/Bracket.jsx';
import MatchCard from '../../components/matches/MatchCard.jsx';
import LeaderboardTable from '../../components/leaderboard/LeaderboardTable.jsx';
import NotFound from './NotFound.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDocumentTitle } from '../../hooks/index.js';
import { GAMES, FORMATS } from '../../lib/constants.js';
import { getDisplayStatus, activeRegistrations, rosterLimits } from '../../utils/registrationRules.js';
import { computeStandings, describeRules, rulesFor, tournamentChampion } from '../../utils/scoring.js';
import { byId, matchesForTournament } from '../../utils/selectors.js';
import { formatMoney, formatDateTime, formatDate } from '../../utils/format.js';

export default function TournamentDetail() {
  const { id } = useParams();
  const { db, loading, error, refresh } = useData();
  const { isAdmin } = useAuth();
  const t = byId(db.tournaments, id);
  useDocumentTitle(t?.name ?? 'Tournament');
  const [tab, setTab] = useState('overview');

  const matches = useMemo(() => (t ? matchesForTournament(db, t.id) : []), [db, t]);
  const standings = useMemo(() => (t ? computeStandings(db, { tournamentId: t.id }) : []), [db, t]);
  const regs = useMemo(() => (t ? db.registrations.filter((r) => r.tournamentId === t.id && r.status !== 'withdrawn') : []), [db, t]);

  if (loading) return <PageFallback />;
  if (error) return <div className="container-page pt-32"><ErrorState message={error} onRetry={refresh} /></div>;
  if (!t || (t.status === 'draft' && !isAdmin)) return <NotFound what="tournament" />;

  const game = GAMES[t.game];
  const status = getDisplayStatus(t);
  const registered = activeRegistrations(db.registrations, t.id).length;
  const { min, max } = rosterLimits(t.format);
  const rules = rulesFor(t);
  const champion = tournamentChampion(db, t);
  const isH2H = rules.type !== 'br';

  const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'schedule', label: 'Schedule', count: matches.length },
    { value: 'teams', label: 'Teams', count: regs.length },
    { value: 'standings', label: isH2H ? 'Bracket & Standings' : 'Standings' },
    { value: 'rules', label: 'Rules' },
  ];

  return (
    <>
      {/* Banner */}
      <section className="relative overflow-hidden border-b border-white/5 pt-20">
        <GameArt game={t.game} className="absolute inset-0 opacity-70" label={false} seed={3} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/70 to-ink-900/20" aria-hidden />
        <div className="container-page relative pb-10 pt-10 sm:pt-16">
          <Link to="/tournaments" className="mb-6 inline-flex items-center gap-1.5 text-sm text-mist-400 hover:text-lime">
            <ArrowLeft className="h-4 w-4" /> All tournaments
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <TournamentStatusBadge status={status} />
            <span className="rounded-md border border-white/10 bg-ink-950/50 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-mist-200">
              {game.name} · {FORMATS[t.format].label}
            </span>
            {t.status === 'draft' && <span className="font-mono text-[11px] uppercase text-warn">Admin preview — not public</span>}
          </div>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-4 max-w-4xl text-4xl font-bold uppercase leading-[0.95] sm:text-6xl">
            {t.name}
          </motion.h1>
          {t.description && <p className="mt-4 max-w-2xl text-mist-300">{t.description}</p>}
          {champion && (
            <p className="mt-5 inline-flex items-center gap-2 rounded-xl border border-lime/30 bg-lime/10 px-3 py-2 text-sm text-lime">
              <Trophy className="h-4 w-4" /> Champion: <strong>{byId(db.teams, champion.teamId)?.name}</strong>
            </p>
          )}
          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <KeyStat icon={Trophy} label="Prize pool" value={formatMoney(t.prizePool)} accent />
            <KeyStat icon={Ticket} label="Entry fee" value={formatMoney(t.entryFee)} sub="per team" />
            <KeyStat icon={Users} label="Teams" value={`${registered}/${t.maxTeams}`} sub="registered" />
            <KeyStat icon={Gamepad2} label="Team size" value={`${min}${max > min ? `+${max - min}` : ''}`} sub={max > min ? 'players + subs' : 'players'} />
            <KeyStat icon={Clock} label="Reg. deadline" value={formatDate(t.regDeadline, { year: undefined })} />
            <KeyStat icon={CalendarDays} label="Starts" value={formatDate(t.startAt, { year: undefined })} />
          </dl>
        </div>
      </section>

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <Tabs value={tab} onChange={setTab} options={tabs} className="mb-6" ariaLabel="Tournament sections" />
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} role="tabpanel">
            {tab === 'overview' && <Overview t={t} rules={rules} />}
            {tab === 'schedule' &&
              (matches.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {matches.map((m) => (
                    <MatchCard key={m.id} match={m} db={db} compact />
                  ))}
                </div>
              ) : (
                <EmptyState icon={CalendarClock} title="Schedule not published yet" message="Fixtures are published by admins after registration closes." />
              ))}
            {tab === 'teams' &&
              (regs.length ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {regs.map((r) => {
                    const team = byId(db.teams, r.teamId);
                    if (!team) return null;
                    return (
                      <li key={r.id}>
                        <Link to={`/teams/${team.id}`} className="surface surface-hover flex items-center gap-3 p-3">
                          <TeamLogo team={team} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-mist-100">{team.name}</p>
                            <p className="truncate text-xs text-mist-500">{team.college}</p>
                          </div>
                          <RegStatusBadge status={r.status} />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState icon={Users} title="No teams yet" message="Be the first squad to lock in a slot." />
              ))}
            {tab === 'standings' && (
              <div className="space-y-8">
                {isH2H && matches.length > 0 && (
                  <div>
                    <h2 className="mb-4 text-lg font-semibold uppercase">Bracket</h2>
                    <Bracket matches={matches} db={db} />
                  </div>
                )}
                <div>
                  <h2 className="mb-1 text-lg font-semibold uppercase">Standings</h2>
                  <p className="mb-4 text-xs text-mist-500">{describeRules(rules)}</p>
                  {standings.length ? <LeaderboardTable rows={standings} db={db} /> : <EmptyState icon={Medal} title="No results yet" message="Standings are calculated automatically once results are posted." />}
                </div>
              </div>
            )}
            {tab === 'rules' && (
              <div className="surface p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold uppercase"><ScrollText className="h-5 w-5 text-lime" /> Rules & regulations</h2>
                <ol className="space-y-3">
                  {t.rules.map((r, i) => (
                    <li key={i} className="flex gap-3 text-sm text-mist-300">
                      <span className="font-mono text-xs text-lime">{String(i + 1).padStart(2, '0')}</span>
                      {r}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </motion.div>
        </div>
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {t.status !== 'draft' && t.status !== 'cancelled' && <RegisterPanel tournament={t} />}
          {t.status === 'cancelled' && <div className="rounded-2xl border border-danger/30 bg-danger/5 p-5 text-sm text-danger">This tournament has been cancelled.</div>}
          <PrizeTable t={t} />
        </aside>
      </div>
    </>
  );
}

function KeyStat({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-ink-900/60 p-3 backdrop-blur">
      <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-mist-500">
        <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
      </dt>
      <dd className={`mt-1 font-display text-lg font-bold tabular ${accent ? 'text-lime' : 'text-mist-100'}`}>{value}</dd>
      {sub && <p className="text-[11px] text-mist-500">{sub}</p>}
    </div>
  );
}

function Overview({ t, rules }) {
  const g = GAMES[t.game];
  const rows = [
    ['Game', `${g.full} (${g.genre})`],
    ['Format', FORMATS[t.format].label],
    ['Mode', t.mode ?? 'Online'],
    ['Registration closes', formatDateTime(t.regDeadline)],
    ['Starts', formatDateTime(t.startAt)],
    ['Ends', t.endAt ? formatDateTime(t.endAt) : 'TBA'],
    ['Approval', t.requiresApproval ? 'Registrations reviewed by admins' : 'Instant confirmation'],
  ];
  return (
    <div className="space-y-6">
      <div className="surface p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold uppercase"><MonitorPlay className="h-5 w-5 text-lime" /> Tournament details</h2>
        <dl className="divide-y divide-white/5">
          {rows.map(([k, v]) => (
            <div key={k} className="grid gap-1 py-2.5 text-sm sm:grid-cols-[200px_1fr]">
              <dt className="text-mist-500">{k}</dt>
              <dd className="text-mist-100">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="surface p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold uppercase"><ListChecks className="h-5 w-5 text-lime" /> Entry requirements</h2>
          <ul className="space-y-2.5">
            {t.requirements.map((r) => (
              <li key={r} className="flex gap-2.5 text-sm text-mist-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rotate-45 bg-lime" aria-hidden /> {r}
              </li>
            ))}
          </ul>
        </div>
        <div className="surface p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold uppercase"><Award className="h-5 w-5 text-lime" /> Scoring</h2>
          <p className="text-sm text-mist-300">{describeRules(rules)}</p>
          {rules.type === 'br' && (
            <div className="mt-4 grid grid-cols-6 gap-1.5 text-center">
              {rules.placementPoints.slice(0, 12).map((p, i) => (
                <div key={i} className="rounded-md bg-white/[0.04] py-1.5">
                  <p className="text-[10px] text-mist-500">#{i + 1}</p>
                  <p className="font-display text-sm font-bold text-mist-100">{p}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PrizeTable({ t }) {
  const medal = ['text-lime', 'text-cyan', 'text-violet-400'];
  return (
    <section className="surface p-5 sm:p-6" aria-labelledby="prize-title">
      <h2 id="prize-title" className="flex items-center gap-2 text-lg font-semibold uppercase">
        <Trophy className="h-5 w-5 text-lime" /> Prize distribution
      </h2>
      <p className="mt-1 font-display text-3xl font-bold text-lime tabular">{formatMoney(t.prizePool)}</p>
      <ul className="mt-4 divide-y divide-white/5">
        {t.prizeDistribution.map((p, i) => (
          <li key={p.place} className="flex items-center justify-between py-2.5 text-sm">
            <span className={`font-display font-semibold ${medal[i] ?? 'text-mist-300'}`}>{p.place}</span>
            <span className="font-mono tabular text-mist-100">{formatMoney(p.amount)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
