import { Compass } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import { useDocumentTitle } from '../../hooks/index.js';

export default function NotFound({ what }) {
  useDocumentTitle('Not found');
  return (
    <section className="container-page flex min-h-[70vh] flex-col items-center justify-center pt-24 text-center">
      <p className="stroke-text font-display text-[120px] font-bold leading-none sm:text-[180px]">404</p>
      <Compass className="-mt-4 h-10 w-10 text-lime" aria-hidden />
      <h1 className="mt-4 text-3xl font-bold uppercase">{what ? `This ${what} doesn’t exist` : 'Out of the zone'}</h1>
      <p className="mt-2 max-w-md text-mist-400">The page you’re looking for has moved, been removed, or never spawned.</p>
      <div className="mt-8 flex gap-3">
        <Button to="/">Go home</Button>
        <Button to="/tournaments" variant="secondary">
          Browse tournaments
        </Button>
      </div>
    </section>
  );
}
