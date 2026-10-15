import { Suspense, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, Trophy, ClipboardList, Users, UserRound, Swords, BarChart3, Settings, Menu, X, ArrowLeft } from 'lucide-react';
import Logo from '../components/layout/Logo.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import PageFallback from '../components/ui/PageFallback.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { cn } from '../utils/format.js';

const LINKS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/tournaments', label: 'Tournaments', icon: Trophy },
  { to: '/admin/registrations', label: 'Registrations', icon: ClipboardList, badge: 'pending' },
  { to: '/admin/teams', label: 'Teams', icon: Users },
  { to: '/admin/players', label: 'Players', icon: UserRound },
  { to: '/admin/matches', label: 'Matches', icon: Swords },
  { to: '/admin/leaderboard', label: 'Leaderboard', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="min-h-screen bg-ink-900 lg:grid lg:grid-cols-[260px_1fr]">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-lime focus:px-4 focus:py-2 focus:text-ink-950">
        Skip to content
      </a>
      <aside className="sticky top-0 hidden h-screen border-r border-white/5 bg-ink-950 lg:block">
        <Sidebar />
      </aside>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/5 bg-ink-950/90 px-4 backdrop-blur lg:hidden">
        <Logo to="/admin" />
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-mist-200 hover:bg-white/5" aria-label="Open admin menu" aria-expanded={open}>
          <Menu className="h-6 w-6" />
        </button>
      </header>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} aria-hidden />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="relative h-full w-72 max-w-[85vw] border-r border-white/5 bg-ink-950" role="dialog" aria-modal="true" aria-label="Admin menu">
              <button onClick={() => setOpen(false)} className="absolute right-3 top-4 rounded-lg p-2 text-mist-400 hover:bg-white/5" aria-label="Close admin menu">
                <X className="h-5 w-5" />
              </button>
              <Sidebar />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
      <main id="admin-main" className="min-w-0 px-4 py-8 sm:px-6 lg:px-10">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

function Sidebar() {
  const { profile } = useAuth();
  const { db } = useData();
  const pending = db.registrations.filter((r) => r.status === 'pending').length;
  return (
    <div className="flex h-full flex-col p-4">
      <div className="px-2 py-2">
        <Logo to="/admin" />
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400">Admin console</p>
      </div>
      <nav className="mt-6 flex-1 space-y-1" aria-label="Admin">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition', isActive ? 'bg-lime/10 text-lime' : 'text-mist-400 hover:bg-white/[0.04] hover:text-mist-100')}
          >
            <l.icon className="h-4 w-4" aria-hidden />
            <span className="flex-1">{l.label}</span>
            {l.badge === 'pending' && pending > 0 && <span className="rounded-md bg-warn/15 px-1.5 py-0.5 font-mono text-[10px] text-warn">{pending}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-2 border-t border-white/5 pt-4">
        <NavLink to="/" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-mist-400 hover:bg-white/[0.04] hover:text-mist-100">
          <ArrowLeft className="h-4 w-4" /> Back to site
        </NavLink>
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar profile={profile} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-mist-100">{profile?.displayName}</p>
            <p className="truncate text-xs text-mist-500">Administrator</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminHeader({ title, description, children }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold uppercase">{title}</h1>
        {description && <p className="mt-1 text-sm text-mist-400">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
