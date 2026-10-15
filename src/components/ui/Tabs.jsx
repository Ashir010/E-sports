import { motion } from 'framer-motion';
import { useId } from 'react';
import { cn } from '../../utils/format.js';

/** Segmented control with an animated active pill. Works as a radio group for filters. */
export default function Tabs({ value, onChange, options, className, size = 'md', ariaLabel }) {
  const id = useId();
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn('scrollbar-thin inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-white/[0.07] bg-ink-850 p-1', className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative shrink-0 rounded-lg font-display font-medium tracking-wide transition-colors',
              size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
              active ? 'text-ink-950' : 'text-mist-400 hover:text-mist-100'
            )}
          >
            {active && <motion.span layoutId={`tab-${id}`} className="absolute inset-0 rounded-lg bg-lime" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
            <span className="relative inline-flex items-center gap-1.5">
              {o.icon && <o.icon className="h-4 w-4" aria-hidden />}
              {o.label}
              {o.count !== undefined && <span className={cn('tabular text-[10px]', active ? 'text-ink-950/70' : 'text-mist-500')}>{o.count}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
