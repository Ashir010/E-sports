import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Users, CalendarDays, Clock, Ticket, ArrowUpRight } from 'lucide-react';
import GameArt from '../ui/GameArt.jsx';
import Button from '../ui/Button.jsx';
import { TournamentStatusBadge } from '../ui/Badge.jsx';
import { GAMES, FORMATS } from '../../lib/constants.js';
import { formatMoney, formatDate, relativeTime, cn } from '../../utils/format.js';
import { getDisplayStatus, activeRegistrations } from '../../utils/registrationRules.js';

export default function TournamentCard({ tournament: t, registrations, view = 'grid' }) {
  const status = getDisplayStatus(t);
  const registered = activeRegistrations(registrations, t.id).length;
  const full = registered >= t.maxTeams;
  const canRegister = status === 'open' && !full;
  const fill = Math.min(100, (registered / t.maxTeams) * 100);
  const game = GAMES[t.game];

  if (view === 'list') {
    return (
      <motion.article layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="surface surface-hover group flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <GameArt game={t.game} label={false} className="h-24 w-full shrink-0 rounded-xl sm:h-20 sm:w-32" seed={t.id.length} />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <TournamentStatusBadge status={status} />
            <span className="text-xs text-mist-500">{game.name} · {FORMATS[t.format].label}</span>
          </div>
          <h3 className="truncate text-lg font-semibold">
            <Link to={`/tournaments/${t.id}`} className="after:absolute hover:text-lime">
              {t.name}
            </Link>
          </h3>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-mist-400">
            <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(t.startAt)}</span>
            <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {registered}/{t.maxTeams} teams</span>
            <span className="inline-flex items-center gap-1"><Ticket className="h-3.5 w-3.5" /> {formatMoney(t.entryFee)}</span>
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
          <p className="font-display text-xl font-bold text-lime tabular">{formatMoney(t.prizePool)}</p>
          <div className="flex gap-2">
            <Button to={`/tournaments/${t.id}`} variant="secondary" size="sm">Details</Button>
            {canRegister && <Button to={`/tournaments/${t.id}#register`} size="sm">Register</Button>}
          </div>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="surface group relative flex h-full flex-col overflow-hidden transition-colors duration-300 hover:border-white/15"
      style={{ '--g': game.color }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ boxShadow: `inset 0 0 0 1px ${game.color}55, 0 20px 60px -30px ${game.color}` }} aria-hidden />
      <div className="relative">
        <GameArt game={t.game} className="h-40" seed={t.id.length} />
        <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-2">
          <TournamentStatusBadge status={status} />
          <span className="rounded-md bg-ink-950/70 px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-mist-200 backdrop-blur">{FORMATS[t.format].label}</span>
        </div>
        <div className="absolute bottom-3 left-4 flex items-center gap-2">
          <span className="h-2 w-2 rotate-45 rounded-[2px]" style={{ background: game.color }} aria-hidden />
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-mist-200">{game.name}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-xl font-semibold leading-tight">
          <Link to={`/tournaments/${t.id}`} className="hover:text-lime focus-visible:text-lime">
            {t.name}
          </Link>
        </h3>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat icon={Trophy} label="Prize pool" value={formatMoney(t.prizePool)} accent />
          <Stat icon={Ticket} label="Entry fee" value={formatMoney(t.entryFee)} />
          <Stat icon={CalendarDays} label="Starts" value={formatDate(t.startAt, { year: undefined })} />
          <Stat icon={Clock} label="Reg. closes" value={status === 'open' ? relativeTime(t.regDeadline) : formatDate(t.regDeadline, { year: undefined })} />
        </div>
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 text-mist-400"><Users className="h-3.5 w-3.5" /> Teams registered</span>
            <span className={cn('font-mono tabular', full ? 'text-warn' : 'text-mist-200')}>
              {registered}/{t.maxTeams}
              {full && ' · Full'}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/5" role="progressbar" aria-valuenow={registered} aria-valuemin={0} aria-valuemax={t.maxTeams} aria-label="Registration capacity">
            <motion.div className="h-full rounded-full" style={{ background: full ? '#FFB23F' : game.color }} initial={{ width: 0 }} whileInView={{ width: `${fill}%` }} viewport={{ once: true }} transition={{ duration: 0.8, ease: 'easeOut' }} />
          </div>
        </div>
        <div className="mt-auto flex gap-2 pt-5">
          <Button to={`/tournaments/${t.id}`} variant="secondary" size="sm" className="flex-1">
            View Details <ArrowUpRight className="h-4 w-4" />
          </Button>
          {canRegister && (
            <Button to={`/tournaments/${t.id}#register`} size="sm" className="flex-1">
              Register Now
            </Button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function Stat({ icon: Icon, label, value, accent }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-mist-500">
        <Icon className="h-3 w-3" aria-hidden /> {label}
      </p>
      <p className={cn('mt-0.5 truncate font-display text-sm font-semibold tabular', accent ? 'text-lime' : 'text-mist-100')}>{value}</p>
    </div>
  );
}
