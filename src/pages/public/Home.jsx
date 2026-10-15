import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Search, UserPlus, Users, Swords, Trophy, CalendarClock, Gamepad2, ChevronRight } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Tabs from '../../components/ui/Tabs.jsx';
import { Input, Select } from '../../components/ui/Field.jsx';
import SectionHeading from '../../components/ui/SectionHeading.jsx';
import { CardSkeleton, EmptyState, ErrorState, RowSkeleton } from '../../components/ui/States.jsx';
import GameArt from '../../components/ui/GameArt.jsx';
import TournamentCard from '../../components/tournaments/TournamentCard.jsx';
import MatchCard from '../../components/matches/MatchCard.jsx';
import LeaderboardTable from '../../components/leaderboard/LeaderboardTable.jsx';
import PlayerCard from '../../components/players/PlayerCard.jsx';
import HeroVisual from '../../components/home/HeroVisual.jsx';
import { Reveal, stagger, fadeUp } from '../../components/layout/Motion.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDocumentTitle, useDebounce } from '../../hooks/index.js';
import { GAME_LIST } from '../../lib/constants.js';
import { isDemoMode } from '../../services/api.js';
import { filterTournaments, SORTS } from '../../utils/tournamentFilters.js';
import { withMovement } from '../../utils/scoring.js';
import { platformStats, upcomingMatches, spotlightPlayers, publicTournaments } from '../../utils/selectors.js';
import { formatCompact } from '../../utils/format.js';

export default function Home() {
  useDocumentTitle(null);
  const { db, loading, error, refresh } = useData();
  const stats = platformStats(db);
  const standings = useMemo(() => withMovement(db), [db]);
  const next = useMemo(() => upcomingMatches(db, 6), [db]);
  const featured = useMemo(() => filterTournaments(publicTournaments(db), { status: 'open', sort: 'prize' }, db.registrations)[0], [db]);

  return (
    <>
      <Hero db={db} loading={loading} stats={stats} nextMatch={next[0]} topTeams={standings.slice(0, 3)} featured={featured} />
      <GamesStrip db={db} />
      {error ? (
        <div className="container-page py-16">
          <ErrorState message={error} onRetry={refresh} />
        </div>
      ) : (
        <>
          <FeaturedTournaments db={db} loading={loading} />
          <UpcomingMatches db={db} loading={loading} matches={next} />
          <LeaderboardPreview db={db} loading={loading} rows={standings.slice(0, 5)} />
          <HowItWorks />
          <Spotlight db={db} loading={loading} />
          <FinalCta />
        </>
      )}
    </>
  );
}

/* ---------------- A/B. Hero ---------------- */
const HEADLINE = ['YOUR GAME.', 'YOUR TEAM.', 'YOUR GLORY.'];

function Hero({ db, loading, stats, nextMatch, topTeams, featured }) {
  const { profile } = useAuth();
  return (
    <section className="relative overflow-hidden pt-20" aria-labelledby="hero-title">
      <div className="bg-grid mask-radial absolute inset-0 opacity-70" aria-hidden />
      <div className="absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-lime/[0.06] blur-[120px]" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" aria-hidden />
      <div className="container-page relative grid min-h-[calc(100svh-5rem)] items-center gap-12 py-12 lg:grid-cols-[1.1fr_1fr] lg:py-16">
        <div>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 inline-flex items-center gap-2 rounded-full border border-lime/25 bg-lime/[0.06] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-lime">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-lime" /> {stats.activeTournaments} active tournaments
          </motion.p>
          <h1 id="hero-title" className="font-display text-[44px] font-bold uppercase leading-[0.92] tracking-tight sm:text-7xl xl:text-[88px]">
            {HEADLINE.map((line, i) => (
              <motion.span key={line} className="block" initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ delay: 0.1 + i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
                {i === 2 ? <span className="text-gradient-lime">{line}</span> : line}
              </motion.span>
            ))}
          </h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-6 max-w-lg text-lg text-mist-300 sm:text-xl">
            Compete with the best. Build your squad. Dominate the leaderboard.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62 }} className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button to="/tournaments" size="lg">
              Explore Tournaments <ArrowRight className="h-5 w-5" />
            </Button>
            <Button to={profile ? '/teams/create' : '/signup?next=/teams/create'} size="lg" variant="secondary">
              <UserPlus className="h-5 w-5" /> Create Your Team
            </Button>
          </motion.div>
          <motion.dl initial="hidden" animate="show" variants={stagger} className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-white/[0.07] pt-6">
            {[
              ['Tournaments', stats.tournaments],
              ['Players', stats.players],
              ['Teams', stats.teams],
            ].map(([label, value]) => (
              <motion.div key={label} variants={fadeUp}>
                <dd className="font-display text-3xl font-bold tabular text-mist-100 sm:text-4xl">{loading ? '—' : formatCompact(value)}</dd>
                <dt className="mt-1 text-xs uppercase tracking-wider text-mist-500">{label}</dt>
              </motion.div>
            ))}
          </motion.dl>
          {isDemoMode && <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-mist-600">Figures from demo data</p>}
        </div>
        <div className="relative hidden sm:block">{!loading && <HeroVisual db={db} nextMatch={nextMatch} topTeams={topTeams} featured={featured} />}</div>
      </div>
    </section>
  );
}

/* ---------------- Games strip ---------------- */
function GamesStrip({ db }) {
  return (
    <section className="container-page py-14" aria-label="Supported games">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {GAME_LIST.map((g, i) => {
          const count = db.tournaments.filter((t) => t.game === g.id && ['open', 'upcoming', 'ongoing'].includes(t.status)).length;
          return (
            <Reveal key={g.id} delay={i * 0.06}>
              <Link to={`/tournaments?game=${g.id}`} className="group relative block overflow-hidden rounded-2xl border border-white/[0.07] transition hover:border-white/20">
                <GameArt game={g.id} label={false} className="h-28 transition-transform duration-500 group-hover:scale-105 sm:h-32" />
                <div className="absolute inset-0 flex flex-col justify-end p-4">
                  <p className="font-display text-lg font-bold uppercase text-mist-100 sm:text-xl">{g.name}</p>
                  <p className="flex items-center gap-1 text-xs text-mist-400">
                    {g.genre} · {count} active <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </p>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- C. Featured tournaments ---------------- */
function FeaturedTournaments({ db, loading }) {
  const [game, setGame] = useState('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('date');
  const debounced = useDebounce(q);
  const list = useMemo(
    () => filterTournaments(publicTournaments(db).filter((t) => t.status !== 'cancelled'), { game, q: debounced, sort }, db.registrations),
    [db, game, debounced, sort]
  );
  const shown = list.slice(0, 6);
  const tabs = [{ value: 'all', label: 'All Games' }, ...GAME_LIST.map((g) => ({ value: g.id, label: g.name }))];

  return (
    <section className="container-page py-16 sm:py-20" aria-labelledby="featured-title">
      <Reveal>
        <SectionHeading
          eyebrow="// Compete"
          title={<span id="featured-title">Featured Tournaments</span>}
          description="Open registrations, upcoming showdowns and recent finals from campuses across India."
          action={
            <Button to="/tournaments" variant="ghost">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          }
        />
      </Reveal>
      <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={game} onChange={setGame} options={tabs} ariaLabel="Filter by game" />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input icon={Search} placeholder="Search tournaments" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search tournaments" className="sm:w-64" />
          <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort tournaments" options={Object.entries(SORTS).map(([value, label]) => ({ value, label: `Sort: ${label}` }))} className="sm:w-52" />
        </div>
      </div>
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton count={3} />
        </div>
      ) : shown.length === 0 ? (
        <EmptyState
          icon={Gamepad2}
          title="No tournaments match"
          message="Try another game or clear your search."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setGame('all');
                setQ('');
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {shown.map((t) => (
              <TournamentCard key={t.id} tournament={t} registrations={db.registrations} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
      {list.length > shown.length && (
        <div className="mt-8 text-center">
          <Button to={`/tournaments${game !== 'all' ? `?game=${game}` : ''}`} variant="secondary">
            See {list.length - shown.length} more <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </section>
  );
}

/* ---------------- D. Upcoming matches ---------------- */
function UpcomingMatches({ db, loading, matches }) {
  return (
    <section className="relative py-16 sm:py-20" aria-labelledby="matches-title">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ink-850/60 to-transparent" aria-hidden />
      <div className="container-page relative">
        <Reveal>
          <SectionHeading
            eyebrow="// Schedule"
            title={<span id="matches-title">Upcoming Matches</span>}
            description="Times shown in IST. Results are entered by tournament admins after each match — we don’t stream live scores."
            action={
              <Button to="/matches" variant="ghost">
                Full schedule <ArrowRight className="h-4 w-4" />
              </Button>
            }
          />
        </Reveal>
        <div className="mb-5 flex flex-wrap gap-4 text-xs text-mist-400">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 animate-pulse-dot rounded-full bg-violet" /> In progress — result pending</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan" /> Scheduled</span>
        </div>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <CardSkeleton count={3} className="h-48" />
          </div>
        ) : matches.length === 0 ? (
          <EmptyState icon={CalendarClock} title="No matches scheduled" message="New fixtures appear here as soon as admins publish them." />
        ) : (
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={stagger} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {matches.map((m) => (
              <motion.div key={m.id} variants={fadeUp}>
                <MatchCard match={m} db={db} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

/* ---------------- E. Leaderboard preview ---------------- */
function LeaderboardPreview({ db, loading, rows }) {
  return (
    <section className="container-page py-16 sm:py-20" aria-labelledby="lb-title">
      <Reveal>
        <SectionHeading
          eyebrow="// Rankings"
          title={<span id="lb-title">Leaderboard</span>}
          description="Overall team rankings in circuit points, calculated from every completed match result."
          action={
            <Button to="/leaderboard" variant="ghost">
              Full leaderboard <ArrowRight className="h-4 w-4" />
            </Button>
          }
        />
      </Reveal>
      <Reveal delay={0.1}>{loading ? <RowSkeleton rows={5} /> : rows.length ? <LeaderboardTable rows={rows} db={db} compact /> : <EmptyState icon={Trophy} title="No results yet" message="Rankings appear once the first match result is posted." />}</Reveal>
    </section>
  );
}

/* ---------------- F. How it works ---------------- */
const STEPS = [
  { icon: UserPlus, title: 'Create an account', text: 'Sign up with your college email and set up your gamer profile and in-game IDs.' },
  { icon: Users, title: 'Join or build a team', text: 'Create a squad and share your invite code, or join a friend’s team. Then register for a tournament.' },
  { icon: Trophy, title: 'Compete & climb', text: 'Play your scheduled matches. Every posted result earns points and moves you up the leaderboard.' },
];

function HowItWorks() {
  return (
    <section className="container-page py-16 sm:py-20" aria-labelledby="how-title">
      <Reveal>
        <SectionHeading eyebrow="// Get started" title={<span id="how-title">How It Works</span>} align="center" />
      </Reveal>
      <div className="relative grid gap-5 md:grid-cols-3">
        <div className="absolute left-[16%] right-[16%] top-12 hidden h-px bg-gradient-to-r from-lime/0 via-lime/40 to-lime/0 md:block" aria-hidden />
        {STEPS.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.1}>
            <div className="surface relative h-full p-6 text-center">
              <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
                <div className="clip-corner absolute inset-0 bg-lime/15" />
                <s.icon className="relative h-7 w-7 text-lime" aria-hidden />
              </div>
              <p className="mt-5 font-mono text-xs text-mist-500">STEP 0{i + 1}</p>
              <h3 className="mt-1 text-xl font-semibold uppercase">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mist-400">{s.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------- G. Player spotlight ---------------- */
function Spotlight({ db, loading }) {
  const players = useMemo(() => spotlightPlayers(db, 4), [db]);
  return (
    <section className="container-page py-16 sm:py-20" aria-labelledby="spot-title">
      <Reveal>
        <SectionHeading eyebrow="// Spotlight" title={<span id="spot-title">Player Spotlight</span>} description="The top-ranked player from each of the leading teams." />
      </Reveal>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CardSkeleton count={4} className="h-64" />
        </div>
      ) : (
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {players.map((p) => (
            <motion.div key={p.profileId} variants={fadeUp}>
              <PlayerCard player={p} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}

/* ---------------- H. Final CTA ---------------- */
function FinalCta() {
  const { profile } = useAuth();
  return (
    <section className="container-page pt-12" aria-labelledby="cta-title">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-lime/20 bg-ink-850 px-6 py-14 text-center sm:px-12 sm:py-20">
          <div className="bg-grid absolute inset-0 opacity-50" aria-hidden />
          <div className="absolute -top-32 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-lime/20 blur-[100px]" aria-hidden />
          <div className="absolute -bottom-32 right-0 h-64 w-96 rounded-full bg-violet/25 blur-[100px]" aria-hidden />
          <div className="relative">
            <Swords className="mx-auto h-10 w-10 text-lime" aria-hidden />
            <h2 id="cta-title" className="mx-auto mt-5 max-w-3xl text-4xl font-bold uppercase leading-none sm:text-6xl">
              Your campus. <span className="text-gradient-lime">Your arena.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-mist-300">Registrations are open now. Assemble your squad, lock in your slot and play for the title.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button to={profile ? '/tournaments?status=open' : '/signup'} size="lg">
                {profile ? 'Find a Tournament' : 'Create Free Account'} <ArrowRight className="h-5 w-5" />
              </Button>
              <Button to="/leaderboard" size="lg" variant="secondary">
                View Rankings
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

