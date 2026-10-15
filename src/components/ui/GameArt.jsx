import { GAMES } from '../../lib/constants.js';
import { cn } from '../../utils/format.js';

/**
 * Original abstract cover art per game (no official logos or copyrighted artwork).
 * Each game gets its own colour, composition and glyph.
 */
export default function GameArt({ game, className, label = true, seed = 0 }) {
  const g = GAMES[game] ?? GAMES.valorant;
  const id = `ga-${game}-${seed}`;
  return (
    <div className={cn('relative overflow-hidden bg-ink-850', className)}>
      <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <radialGradient id={`${id}-glow`} cx="70%" cy="30%" r="70%">
            <stop offset="0" stopColor={g.color} stopOpacity="0.55" />
            <stop offset="0.55" stopColor={g.color} stopOpacity="0.08" />
            <stop offset="1" stopColor="#08090B" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.35" stopColor="#0C0E11" stopOpacity="0" />
            <stop offset="1" stopColor="#0C0E11" stopOpacity="0.95" />
          </linearGradient>
          <pattern id={`${id}-grid`} width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="#fff" strokeOpacity="0.05" />
          </pattern>
        </defs>
        <rect width="400" height="220" fill="#0C0E11" />
        <rect width="400" height="220" fill={`url(#${id}-grid)`} />
        <rect width="400" height="220" fill={`url(#${id}-glow)`} />
        <Glyph game={game} color={g.color} accent={g.accent} />
        <rect width="400" height="220" fill={`url(#${id}-fade)`} />
      </svg>
      {label && (
        <span className="stroke-text pointer-events-none absolute -bottom-3 left-3 select-none font-display text-6xl font-bold uppercase leading-none opacity-[0.14] sm:text-7xl" aria-hidden>
          {g.name}
        </span>
      )}
    </div>
  );
}

function Glyph({ game, color, accent }) {
  switch (game) {
    case 'valorant':
      // Angular blades / tactical chevrons
      return (
        <g>
          <path d="M250 20 L330 20 L270 200 L190 200 Z" fill={color} fillOpacity="0.22" />
          <path d="M300 20 L350 20 L300 160 L260 160 Z" fill={color} fillOpacity="0.5" />
          <path d="M340 60 L380 60 L345 160 L320 160 Z" fill={accent} fillOpacity="0.35" />
          <circle cx="300" cy="105" r="46" fill="none" stroke={accent} strokeOpacity="0.6" strokeWidth="1.5" />
          <path d="M300 49 V75 M300 135 V161 M244 105 H270 M330 105 H356" stroke={accent} strokeWidth="2" />
        </g>
      );
    case 'bgmi':
      // Drop zone circles + flight path
      return (
        <g>
          <circle cx="290" cy="110" r="90" fill="none" stroke={color} strokeOpacity="0.25" strokeWidth="2" strokeDasharray="6 6" />
          <circle cx="300" cy="100" r="52" fill={color} fillOpacity="0.12" stroke={color} strokeOpacity="0.7" strokeWidth="2" />
          <circle cx="306" cy="96" r="18" fill={color} fillOpacity="0.55" />
          <path d="M40 30 L390 190" stroke={accent} strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="2 8" />
          <path d="M120 66 l14 -6 l-4 14 z" fill={accent} />
        </g>
      );
    case 'freefire':
      // Flames / rising shards
      return (
        <g>
          <path d="M230 220 C230 150 290 140 280 70 C320 110 340 140 330 220 Z" fill={color} fillOpacity="0.35" />
          <path d="M270 220 C270 170 310 160 305 110 C335 145 345 175 340 220 Z" fill={accent} fillOpacity="0.45" />
          <path d="M320 220 C330 180 360 170 355 130 C380 160 390 190 385 220 Z" fill={color} fillOpacity="0.55" />
          <path d="M200 40 l10 0 l-5 14 z M360 30 l8 0 l-4 11 z M250 30 l6 0 l-3 8 z" fill={accent} fillOpacity="0.8" />
        </g>
      );
    default:
      // Mini Militia — doodle jetpack trails
      return (
        <g>
          <path d="M160 190 C210 140 230 170 270 120 S330 60 380 70" fill="none" stroke={color} strokeOpacity="0.7" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 10" />
          <path d="M180 200 C240 160 260 190 300 140 S350 90 395 100" fill="none" stroke={accent} strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
          <rect x="300" y="40" width="44" height="44" rx="10" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="2" transform="rotate(12 322 62)" />
          <circle cx="322" cy="62" r="8" fill={accent} />
          <circle cx="240" cy="60" r="4" fill={accent} fillOpacity="0.7" />
          <circle cx="210" cy="90" r="3" fill={color} />
        </g>
      );
  }
}

/** Small coloured game chip used in tables and cards. */
export function GameChip({ game, className }) {
  const g = GAMES[game];
  if (!g) return null;
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-mist-300', className)}>
      <span className="h-2 w-2 rotate-45 rounded-[2px]" style={{ background: g.color }} aria-hidden />
      {g.name}
    </span>
  );
}
