import { motion } from 'framer-motion';
import { Trophy, Crosshair, Radio } from 'lucide-react';
import { TeamLogo } from '../ui/Avatar.jsx';
import { formatDateTime, formatMoney } from '../../utils/format.js';
import { byId } from '../../utils/selectors.js';

const float = (d = 0, y = 10) => ({
  animate: { y: [0, -y, 0] },
  transition: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: d },
});

/** Layered esports composition. Floating cards show real data from the current snapshot. */
export default function HeroVisual({ db, nextMatch, topTeams, featured }) {
  const a = nextMatch ? byId(db.teams, nextMatch.participants[0]) : null;
  const b = nextMatch ? byId(db.teams, nextMatch.participants[1]) : null;
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[560px]" aria-hidden>
      {/* atmospheric glow */}
      <div className="absolute inset-[12%] rounded-full bg-lime/20 blur-[90px]" />
      <div className="absolute right-0 top-0 h-1/2 w-1/2 rounded-full bg-violet/25 blur-[90px]" />

      {/* rotating rings */}
      <svg viewBox="0 0 500 500" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="ring" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#C6FF3D" />
            <stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <motion.g style={{ originX: '250px', originY: '250px' }} animate={{ rotate: 360 }} transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}>
          <circle cx="250" cy="250" r="230" fill="none" stroke="url(#ring)" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="2 10" />
          <circle cx="250" cy="20" r="4" fill="#C6FF3D" />
        </motion.g>
        <motion.g style={{ originX: '250px', originY: '250px' }} animate={{ rotate: -360 }} transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}>
          <circle cx="250" cy="250" r="185" fill="none" stroke="#fff" strokeOpacity="0.08" strokeWidth="1" />
          <path d="M250 65 A185 185 0 0 1 435 250" fill="none" stroke="#8B5CF6" strokeOpacity="0.7" strokeWidth="2" />
          <circle cx="65" cy="250" r="3" fill="#22D3EE" />
        </motion.g>
        <circle cx="250" cy="250" r="140" fill="none" stroke="#fff" strokeOpacity="0.06" />
        {/* reticle ticks */}
        {[0, 90, 180, 270].map((deg) => (
          <line key={deg} x1="250" y1="95" x2="250" y2="120" stroke="#C6FF3D" strokeOpacity="0.6" strokeWidth="2" transform={`rotate(${deg} 250 250)`} />
        ))}
      </svg>

      {/* central emblem */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className="absolute inset-[32%] flex items-center justify-center"
      >
        <div className="clip-corner absolute inset-0 bg-gradient-to-br from-lime via-lime-500 to-lime-600 shadow-glow" />
        <div className="clip-corner absolute inset-[3px] bg-ink-900" />
        <div className="clip-corner absolute inset-[3px] bg-[radial-gradient(circle_at_50%_30%,rgba(198,255,61,.25),transparent_70%)]" />
        <Trophy className="relative h-[42%] w-[42%] text-lime drop-shadow-[0_0_24px_rgba(198,255,61,.7)]" strokeWidth={1.4} />
      </motion.div>

      {/* floating: next match */}
      {nextMatch && (
        <motion.div {...float(0, 8)} className="absolute left-0 top-[8%] w-[58%] min-w-[220px] rounded-2xl border border-white/10 bg-ink-800/90 p-3.5 shadow-2xl backdrop-blur-md sm:left-[-4%]">
          <p className="mb-2.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan">
            <Radio className="h-3 w-3" /> {nextMatch.status === 'in_progress' ? 'In progress' : 'Next up'}
          </p>
          {nextMatch.participants.length > 2 ? (
            <p className="text-sm font-semibold text-mist-100">{nextMatch.participants.length}-team lobby · {nextMatch.round}</p>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <TeamLogo team={a} size="sm" />
                <span className="truncate text-sm font-semibold text-mist-100">{a?.tag ?? 'TBD'}</span>
              </span>
              <span className="font-display text-xs font-bold text-mist-500">VS</span>
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-semibold text-mist-100">{b?.tag ?? 'TBD'}</span>
                <TeamLogo team={b} size="sm" />
              </span>
            </div>
          )}
          <p className="mt-2 text-[11px] text-mist-500">{formatDateTime(nextMatch.scheduledAt)}</p>
        </motion.div>
      )}

      {/* floating: prize pool */}
      {featured && (
        <motion.div {...float(1.2, 10)} className="absolute right-0 top-[30%] rounded-2xl border border-lime/30 bg-ink-800/90 px-4 py-3 shadow-glow-sm backdrop-blur-md sm:right-[-3%]">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-400">Prize pool</p>
          <p className="font-display text-2xl font-bold text-lime tabular">{formatMoney(featured.prizePool)}</p>
          <p className="max-w-[160px] truncate text-[11px] text-mist-400">{featured.name}</p>
        </motion.div>
      )}

      {/* floating: top teams */}
      {topTeams.length > 0 && (
        <motion.div {...float(2.2, 8)} className="absolute bottom-[4%] left-[8%] w-[62%] min-w-[230px] rounded-2xl border border-white/10 bg-ink-800/90 p-3.5 shadow-2xl backdrop-blur-md">
          <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-violet-400">
            <Crosshair className="h-3 w-3" /> Top teams
          </p>
          <ul className="space-y-1.5">
            {topTeams.map((r) => {
              const t = byId(db.teams, r.teamId);
              return (
                <li key={r.teamId} className="flex items-center gap-2.5 text-sm">
                  <span className={`w-4 font-display font-bold ${r.rank === 1 ? 'text-lime' : 'text-mist-500'}`}>{r.rank}</span>
                  <TeamLogo team={t} size="xs" />
                  <span className="flex-1 truncate text-mist-200">{t?.name}</span>
                  <span className="font-mono text-xs text-mist-400 tabular">{r.points} pts</span>
                </li>
              );
            })}
          </ul>
        </motion.div>
      )}
    </div>
  );
}
