import { Link } from 'react-router-dom';
import { Instagram, Youtube, Twitter, MessageCircle } from 'lucide-react';
import Logo from './Logo.jsx';
import { GAME_LIST } from '../../lib/constants.js';

const SOCIALS = [
  { label: 'Instagram', icon: Instagram, href: 'https://instagram.com' },
  { label: 'YouTube', icon: Youtube, href: 'https://youtube.com' },
  { label: 'X (Twitter)', icon: Twitter, href: 'https://x.com' },
  { label: 'Discord', icon: MessageCircle, href: 'https://discord.com' },
];

export default function Footer() {
  return (
    <footer className="relative mt-24 border-t border-white/5 bg-ink-950">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lime/40 to-transparent" aria-hidden />
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-mist-400">
            The home of college esports. Discover tournaments, build your squad, and compete for glory across India’s campuses.
          </p>
          <ul className="mt-6 flex gap-2">
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noreferrer noopener" aria-label={`${s.label} (opens in new tab)`} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-mist-400 transition hover:border-lime/40 hover:text-lime">
                  <s.icon className="h-4 w-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <FooterCol
          title="Platform"
          links={[
            ['Tournaments', '/tournaments'],
            ['Leaderboard', '/leaderboard'],
            ['Matches', '/matches'],
            ['Teams', '/teams'],
            ['Create a Team', '/teams/create'],
          ]}
        />
        <FooterCol title="Games" links={GAME_LIST.map((g) => [g.name, `/tournaments?game=${g.id}`])} />
        <FooterCol
          title="Company"
          links={[
            ['About', '/about'],
            ['Contact', '/contact'],
            ['Privacy Policy', '/privacy'],
            ['Terms & Conditions', '/terms'],
          ]}
        />
      </div>
      <div className="border-t border-white/5">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-mist-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Esports Hub. Built for college esports.</p>
          <p>Game names are trademarks of their respective owners. Esports Hub is not affiliated with any publisher.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h3 className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-mist-500">{title}</h3>
      <ul className="space-y-2.5">
        {links.map(([label, to]) => (
          <li key={label}>
            <Link to={to} className="text-sm text-mist-300 transition hover:text-lime">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
