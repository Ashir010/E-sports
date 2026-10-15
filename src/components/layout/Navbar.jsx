import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, LayoutDashboard, Users, UserRound, Shield, LogOut, ChevronDown, Swords } from 'lucide-react';
import Logo from './Logo.jsx';
import Button from '../ui/Button.jsx';
import { Avatar } from '../ui/Avatar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useScrolled } from '../../hooks/index.js';
import { cn } from '../../utils/format.js';

export const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/tournaments', label: 'Tournaments' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/matches', label: 'Matches' },
  { to: '/teams', label: 'Teams' },
];

export default function Navbar() {
  const scrolled = useScrolled();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { profile, isAdmin } = useAuth();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => (document.body.style.overflow = '');
  }, [open]);

  return (
    <header className={cn('fixed inset-x-0 top-0 z-50 transition-all duration-300', scrolled || open ? 'border-b border-white/[0.06] bg-ink-900/85 backdrop-blur-xl' : 'border-b border-transparent')}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-lime focus:px-4 focus:py-2 focus:text-ink-950">
        Skip to content
      </a>
      <nav className={cn('container-page flex items-center justify-between gap-4 transition-all duration-300', scrolled ? 'h-16' : 'h-20')} aria-label="Main">
        <Logo />
        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  cn('relative rounded-lg px-3.5 py-2 font-display text-sm font-medium tracking-wide transition-colors', isActive ? 'text-mist-100' : 'text-mist-400 hover:text-mist-100')
                }
              >
                {({ isActive }) => (
                  <>
                    {l.label}
                    {isActive && <motion.span layoutId="nav-underline" className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-lime" />}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="hidden items-center gap-2 lg:flex">
          {profile ? <UserMenu profile={profile} isAdmin={isAdmin} /> : (
            <Button to="/login" variant="ghost" size="sm">
              Login
            </Button>
          )}
          <Button to="/tournaments?status=open" size="sm">
            <Swords className="h-4 w-4" /> Join Tournament
          </Button>
        </div>
        <button className="rounded-lg p-2 text-mist-200 hover:bg-white/5 lg:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Close menu' : 'Open menu'}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>
      <AnimatePresence>{open && <MobileMenu profile={profile} isAdmin={isAdmin} onClose={() => setOpen(false)} />}</AnimatePresence>
    </header>
  );
}

function useSignOut() {
  const { signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  return async () => {
    try {
      await signOut();
      toast.info('You have been signed out.');
      navigate('/');
    } catch (e) {
      toast.error(e.message);
    }
  };
}

function accountLinks(isAdmin) {
  return [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/my-teams', label: 'My Teams', icon: Users },
    { to: '/profile/edit', label: 'Edit Profile', icon: UserRound },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin Panel', icon: Shield }] : []),
  ];
}

function UserMenu({ profile, isAdmin }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const signOut = useSignOut();
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu" className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 hover:bg-white/5">
        <Avatar profile={profile} size="sm" />
        <span className="max-w-[120px] truncate text-sm font-medium text-mist-100">{profile.username}</span>
        <ChevronDown className={cn('h-4 w-4 text-mist-400 transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-ink-800 p-1.5 shadow-2xl"
          >
            <div className="px-3 py-2">
              <p className="truncate text-sm font-semibold text-mist-100">{profile.displayName}</p>
              <p className="truncate text-xs text-mist-500">@{profile.username}</p>
            </div>
            <div className="my-1 h-px bg-white/5" />
            {accountLinks(isAdmin).map((l) => (
              <Link key={l.to} to={l.to} role="menuitem" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-mist-300 hover:bg-white/5 hover:text-mist-100">
                <l.icon className="h-4 w-4" /> {l.label}
              </Link>
            ))}
            <Link to={`/players/${profile.username}`} role="menuitem" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-mist-300 hover:bg-white/5 hover:text-mist-100">
              <UserRound className="h-4 w-4" /> Public Profile
            </Link>
            <div className="my-1 h-px bg-white/5" />
            <button role="menuitem" onClick={signOut} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger/10">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileMenu({ profile, isAdmin, onClose }) {
  const signOut = useSignOut();
  return (
    <motion.div
      id="mobile-menu"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'calc(100dvh - 64px)' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="overflow-y-auto border-t border-white/5 bg-ink-900 lg:hidden"
    >
      <motion.ul className="container-page flex flex-col gap-1 py-6" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.04 } } }}>
        {NAV_LINKS.map((l) => (
          <motion.li key={l.to} variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}>
            <NavLink to={l.to} end={l.end} onClick={onClose} className={({ isActive }) => cn('block rounded-xl px-4 py-3.5 font-display text-2xl font-semibold uppercase', isActive ? 'bg-lime/10 text-lime' : 'text-mist-200 hover:bg-white/5')}>
              {l.label}
            </NavLink>
          </motion.li>
        ))}
        <li className="my-3 h-px bg-white/5" />
        {profile ? (
          <>
            <li className="flex items-center gap-3 px-4 py-2">
              <Avatar profile={profile} />
              <div>
                <p className="font-semibold text-mist-100">{profile.displayName}</p>
                <p className="text-xs text-mist-500">@{profile.username}</p>
              </div>
            </li>
            {accountLinks(isAdmin).map((l) => (
              <li key={l.to}>
                <Link to={l.to} onClick={onClose} className="flex items-center gap-3 rounded-xl px-4 py-3 text-mist-300 hover:bg-white/5">
                  <l.icon className="h-5 w-5" /> {l.label}
                </Link>
              </li>
            ))}
            <li>
              <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-danger hover:bg-danger/10">
                <LogOut className="h-5 w-5" /> Sign out
              </button>
            </li>
          </>
        ) : (
          <li>
            <Button to="/login" variant="secondary" className="w-full" onClick={onClose}>
              Login / Sign up
            </Button>
          </li>
        )}
        <li className="mt-2">
          <Button to="/tournaments?status=open" className="w-full" size="lg" onClick={onClose}>
            <Swords className="h-5 w-5" /> Join Tournament
          </Button>
        </li>
      </motion.ul>
    </motion.div>
  );
}
