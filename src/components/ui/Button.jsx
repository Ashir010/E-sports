import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/format.js';

const VARIANTS = {
  primary: 'bg-lime text-ink-950 hover:bg-lime-300 shadow-glow-sm hover:shadow-glow font-semibold',
  secondary: 'bg-ink-750 text-mist-100 border border-white/10 hover:border-lime/40 hover:bg-ink-700',
  outline: 'border border-lime/50 text-lime hover:bg-lime/10',
  ghost: 'text-mist-300 hover:text-mist-100 hover:bg-white/5',
  violet: 'bg-violet text-white hover:bg-violet-600 shadow-violet font-semibold',
  danger: 'bg-danger/10 text-danger border border-danger/40 hover:bg-danger/20',
};
const SIZES = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-[52px] px-7 text-base gap-2.5',
  icon: 'h-10 w-10 justify-center',
};

const base =
  'relative inline-flex select-none items-center justify-center rounded-xl font-display tracking-wide transition-[background,box-shadow,border-color,color] duration-200 disabled:pointer-events-none disabled:opacity-45';

const MotionLink = motion.create(Link);

const Button = forwardRef(function Button({ variant = 'primary', size = 'md', loading = false, to, href, className, children, disabled, ...props }, ref) {
  const classes = cn(base, VARIANTS[variant], SIZES[size], className);
  const tap = disabled || loading ? {} : { whileTap: { scale: 0.97 } };
  const content = (
    <>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </>
  );
  if (to)
    return (
      <MotionLink ref={ref} to={to} className={classes} {...tap} {...props}>
        {content}
      </MotionLink>
    );
  if (href)
    return (
      <motion.a ref={ref} href={href} className={classes} {...tap} {...props}>
        {content}
      </motion.a>
    );
  return (
    <motion.button ref={ref} type="button" className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...tap} {...props}>
      {content}
    </motion.button>
  );
});

export default Button;
