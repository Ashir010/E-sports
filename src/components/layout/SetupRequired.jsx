import { Database } from 'lucide-react';
import { LogoMark } from './Logo.jsx';

/** Shown instead of the app when Supabase credentials are missing. */
export default function SetupRequired() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16">
      <div className="bg-grid mask-radial absolute inset-0 opacity-70" aria-hidden />
      <div className="absolute left-1/2 top-1/4 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-lime/10 blur-[110px]" aria-hidden />
      <div className="surface relative w-full max-w-xl p-6 sm:p-8">
        <LogoMark className="h-11 w-11" />
        <h1 className="mt-5 text-3xl font-bold uppercase">Connect your database</h1>
        <p className="mt-2 text-sm text-mist-400">Esports Hub stores all tournaments, teams and players in Supabase. Add your project credentials to start.</p>
        <ol className="mt-6 space-y-4 text-sm text-mist-300">
          <li className="flex gap-3">
            <span className="font-mono text-lime">01</span>
            <span>Create a free project at <a href="https://supabase.com" target="_blank" rel="noreferrer noopener" className="text-lime underline">supabase.com</a>.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-lime">02</span>
            <span>In the SQL Editor, run <code className="text-mist-100">supabase/migrations/001</code>, <code className="text-mist-100">002</code> and <code className="text-mist-100">003</code> in order.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-lime">03</span>
            <span>
              Create <code className="text-mist-100">.env.local</code> in the project folder (or add these as Vercel environment variables):
              <pre className="mt-2 overflow-x-auto rounded-lg bg-ink-950 p-3 font-mono text-xs text-mist-200">{`VITE_SUPABASE_URL=https://xxxx.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-public-key`}</pre>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-lime">04</span>
            <span>Restart <code className="text-mist-100">npm run dev</code> (or redeploy).</span>
          </li>
        </ol>
        <p className="mt-6 flex items-start gap-2 rounded-xl border border-white/[0.07] bg-ink-850 p-3 text-xs text-mist-400">
          <Database className="mt-0.5 h-4 w-4 shrink-0 text-cyan" aria-hidden />
          Use the <strong className="text-mist-200">anon public</strong> key only — never the service_role key.
        </p>
      </div>
    </main>
  );
}
