import { cn, initials } from '../../utils/format.js';

const SIZES = { xs: 'h-6 w-6 text-[10px]', sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg', xl: 'h-24 w-24 text-3xl' };

export function Avatar({ profile, size = 'md', className }) {
  const name = profile?.displayName || profile?.username || '?';
  if (profile?.avatarUrl)
    return <img src={profile.avatarUrl} alt={`${name}'s avatar`} className={cn('shrink-0 rounded-full object-cover ring-1 ring-white/10', SIZES[size], className)} />;
  const color = profile?.avatarColor ?? '#8B5CF6';
  return (
    <span
      role="img"
      aria-label={`${name}'s avatar`}
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold ring-1 ring-white/10', SIZES[size], className)}
      style={{ background: `linear-gradient(135deg, ${color}33, ${color}12)`, color }}
    >
      {initials(name)}
    </span>
  );
}

/** Team mark: uploaded logo or an angular monogram tile using the team colour. */
export function TeamLogo({ team, size = 'md', className }) {
  if (!team)
    return (
      <span className={cn('inline-flex shrink-0 items-center justify-center rounded-lg border border-dashed border-white/15 font-mono text-[10px] text-mist-500', SIZES[size], className)} aria-label="To be decided">
        TBD
      </span>
    );
  if (team.logoUrl) return <img src={team.logoUrl} alt={`${team.name} logo`} className={cn('shrink-0 rounded-lg object-cover ring-1 ring-white/10', SIZES[size], className)} />;
  const c = team.color ?? '#C6FF3D';
  return (
    <span
      role="img"
      aria-label={`${team.name} logo`}
      className={cn('clip-corner-sm inline-flex shrink-0 items-center justify-center font-display font-bold tracking-tight', SIZES[size], className)}
      style={{ background: `linear-gradient(140deg, ${c}40, ${c}10 70%)`, color: c, boxShadow: `inset 0 0 0 1px ${c}55` }}
    >
      {team.tag?.slice(0, 3)}
    </span>
  );
}
