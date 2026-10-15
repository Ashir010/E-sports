import { cn } from '../../utils/format.js';
import { DISPLAY_STATUS_LABEL } from '../../utils/registrationRules.js';
import { MATCH_STATUS, REG_STATUS } from '../../lib/constants.js';

const TONES = {
  lime: 'bg-lime/10 text-lime border-lime/30',
  violet: 'bg-violet/15 text-violet-400 border-violet/30',
  cyan: 'bg-cyan/10 text-cyan border-cyan/30',
  warn: 'bg-warn/10 text-warn border-warn/30',
  danger: 'bg-danger/10 text-danger border-danger/30',
  neutral: 'bg-white/5 text-mist-300 border-white/10',
};

export default function Badge({ tone = 'neutral', dot = false, pulse = false, className, children }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wider', TONES[tone], className)}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full bg-current', pulse && 'animate-pulse-dot')} aria-hidden />}
      {children}
    </span>
  );
}

const T_TONE = { open: 'lime', closed: 'warn', upcoming: 'cyan', ongoing: 'violet', completed: 'neutral', cancelled: 'danger', draft: 'neutral' };
export function TournamentStatusBadge({ status }) {
  return (
    <Badge tone={T_TONE[status]} dot pulse={status === 'open' || status === 'ongoing'}>
      {DISPLAY_STATUS_LABEL[status]}
    </Badge>
  );
}

const M_TONE = { scheduled: 'cyan', in_progress: 'violet', completed: 'neutral', cancelled: 'danger' };
export function MatchStatusBadge({ status }) {
  return (
    <Badge tone={M_TONE[status]} dot pulse={status === 'in_progress'}>
      {MATCH_STATUS[status]}
    </Badge>
  );
}

const R_TONE = { pending: 'warn', approved: 'lime', rejected: 'danger', withdrawn: 'neutral' };
export function RegStatusBadge({ status }) {
  return <Badge tone={R_TONE[status]}>{REG_STATUS[status]}</Badge>;
}
