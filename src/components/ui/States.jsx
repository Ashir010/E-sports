import { AlertOctagon, Inbox, RotateCw } from 'lucide-react';
import Button from './Button.jsx';
import { cn } from '../../utils/format.js';

export function Skeleton({ className }) {
  return (
    <div className={cn('relative overflow-hidden rounded-lg bg-white/[0.04]', className)} aria-hidden>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
    </div>
  );
}

export function CardSkeleton({ count = 3, className = 'h-[380px]' }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={cn('rounded-2xl', className)} />
      ))}
    </>
  );
}

export function RowSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-2" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, message, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center', className)}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-mist-400">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {message && <p className="mt-1.5 max-w-sm text-sm text-mist-400">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-danger/30 bg-danger/5 px-6 py-12 text-center" role="alert">
      <AlertOctagon className="mb-3 h-8 w-8 text-danger" aria-hidden />
      <h3 className="text-lg font-semibold">{title}</h3>
      {message && <p className="mt-1 max-w-md text-sm text-mist-300">{message}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          <RotateCw className="h-4 w-4" /> Try again
        </Button>
      )}
    </div>
  );
}
