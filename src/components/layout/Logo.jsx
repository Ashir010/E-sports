import { Link } from 'react-router-dom';
import { cn } from '../../utils/format.js';

export function LogoMark({ className }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('h-8 w-8', className)} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#C6FF3D" />
      <path d="M8 7h16l-3 5H13l-1 2h9l-3 5h-8l-1 2h11l-3 5H5z" fill="#08090B" />
    </svg>
  );
}

export default function Logo({ to = '/', className }) {
  return (
    <Link to={to} className={cn('group flex items-center gap-2.5', className)} aria-label="Esports Hub home">
      <LogoMark className="transition-transform duration-300 group-hover:-rotate-6" />
      <span className="font-display text-lg font-bold uppercase leading-none tracking-[0.08em] text-mist-100">
        Esports<span className="text-lime"> Hub</span>
      </span>
    </Link>
  );
}
