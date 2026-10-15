import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { TeamLogo, Avatar } from '../ui/Avatar.jsx';
import { percent, cn } from '../../utils/format.js';
import { byId } from '../../utils/selectors.js';

const STYLE = {
  1: { h: 'sm:h-44', color: '#C6FF3D', ring: 'border-lime/50', label: '1ST' },
  2: { h: 'sm:h-32', color: '#22D3EE', ring: 'border-cyan/40', label: '2ND' },
  3: { h: 'sm:h-24', color: '#A78BFA', ring: 'border-violet/40', label: '3RD' },
};

/** Top-three podium. Visual order 2-1-3 on wider screens, 1-2-3 stacked on mobile. */
export default function Podium({ rows, db, kind = 'team' }) {
  const top = rows.slice(0, 3);
  if (top.length < 1) return null;
  const order = [top[1], top[0], top[2]].filter(Boolean);
  return (
    <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-3">
      {order.map((r, i) => {
        const s = STYLE[r.rank];
        const team = kind === 'team' ? byId(db.teams, r.teamId) : byId(db.teams, r.teamIds?.[0]);
        const profile = kind === 'player' ? byId(db.profiles, r.profileId) : null;
        const href = kind === 'team' ? `/teams/${r.teamId}` : `/players/${profile?.username}`;
        return (
          <motion.div key={r.teamId ?? r.profileId} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: [0.15, 0, 0.3][i], duration: 0.5 }} className={cn('flex flex-col', r.rank === 1 ? 'order-first sm:order-none' : r.rank === 2 ? 'order-2 sm:order-none' : 'order-3')}>
            <Link to={href} className={cn('group relative rounded-2xl border bg-ink-800/90 p-5 text-center transition hover:-translate-y-1', s.ring)} style={{ boxShadow: r.rank === 1 ? `0 20px 60px -25px ${s.color}` : undefined }}>
              {r.rank === 1 && <Crown className="absolute -top-3.5 left-1/2 h-7 w-7 -translate-x-1/2 text-lime drop-shadow-[0_0_10px_rgba(198,255,61,.6)]" aria-hidden />}
              <div className="flex justify-center">{kind === 'team' ? <TeamLogo team={team} size="lg" /> : <Avatar profile={profile} size="lg" />}</div>
              <p className="mt-3 truncate font-display text-lg font-bold text-mist-100 group-hover:text-lime">{kind === 'team' ? team?.name : profile?.username}</p>
              <p className="truncate text-xs text-mist-500">{kind === 'team' ? team?.college : team?.name}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Mini label="Pts" value={r.points} color={s.color} />
                <Mini label="Wins" value={r.wins} />
                <Mini label="Win %" value={percent(r.winRate)} />
              </div>
            </Link>
            <div className={cn('mt-2 hidden items-start justify-center rounded-t-xl border-x border-t pt-3 sm:flex', s.h, s.ring)} style={{ background: `linear-gradient(to bottom, ${s.color}22, transparent)` }}>
              <span className="font-display text-3xl font-bold" style={{ color: s.color }}>
                {s.label}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function Mini({ label, value, color }) {
  return (
    <div className="rounded-lg bg-white/[0.03] py-2">
      <p className="font-display text-base font-bold tabular" style={{ color: color ?? '#F2F4F7' }}>
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-mist-500">{label}</p>
    </div>
  );
}
