import { Skeleton } from './States.jsx';

export default function PageFallback() {
  return (
    <div className="container-page space-y-4 pb-20 pt-32" role="status" aria-label="Loading page">
      <Skeleton className="h-12 w-72" />
      <Skeleton className="h-5 w-96 max-w-full" />
      <div className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}
