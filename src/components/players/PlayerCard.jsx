import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Avatar } from '../ui/Avatar.jsx';
import { GameChip } from '../ui/GameArt.jsx';
import { GAMES } from '../../lib/constants.js';
import { percent } from '../../utils/format.js';

export default function PlayerCard({ player }) {
  const { profile, team, rank, played, winRate } = player;
  const color = GAMES[team?.game ?? profile.favoriteGame]?.color ?? '#C6FF3D';
  return (
    <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }} className="h-full">
      <Link to={`/players/${profile.username}`} className="surface group relative flex h-full flex-col overflow-hidden p-5 transition hover:border-white/15">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl transition-opacity group-hover:opacity-100" style={{ background: `${color}30`, opacity: 0.6 }} aria-hidden />
        <div className="relative flex items-start justify-between">
          <Avatar profile={profile} size="lg" />
          <span className="font-display text-3xl font-bold text-white/10 transition group-hover:text-lime/40">#{rank}</span>
        </div>
        <p className="relative mt-4 truncate font-display text-xl font-bold text-mist-100">{profile.username}</p>
        <p className="relative truncate text-sm text-mist-400">{profile.displayName}</p>
        <div className="relative mt-3 flex flex-wrap items-center gap-2 text-xs text-mist-400">
          <GameChip game={profile.favoriteGame} />
          <span aria-hidden>·</span>
          <span className="truncate">{team?.name}</span>
        </div>
        <dl className="relative mt-5 grid grid-cols-3 gap-2 border-t border-white/5 pt-4 text-center">
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-mist-500">Rank</dt>
            <dd className="font-display text-lg font-bold text-lime">#{rank}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-mist-500">Matches</dt>
            <dd className="font-display text-lg font-bold tabular text-mist-100">{played}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-mist-500">Win %</dt>
            <dd className="font-display text-lg font-bold tabular text-mist-100">{percent(winRate)}</dd>
          </div>
        </dl>
      </Link>
    </motion.div>
  );
}
