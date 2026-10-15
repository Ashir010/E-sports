import { getDisplayStatus, activeRegistrations } from './registrationRules.js';
import { GAMES } from '../lib/constants.js';

export const SORTS = {
  date: 'Upcoming date',
  prize: 'Prize pool',
  popularity: 'Popularity',
};

const STATUS_ORDER = { open: 0, upcoming: 1, closed: 1, ongoing: 2, completed: 3, cancelled: 4, draft: 5 };

/**
 * Pure filter + sort for tournament listings.
 * filters: { q, game, status, format, fee: 'all'|'free'|'paid', sort }
 */
export function filterTournaments(list, filters, registrations = [], now = Date.now()) {
  const q = filters.q?.trim().toLowerCase();
  const out = list.filter((t) => {
    const status = getDisplayStatus(t, now);
    if (q && !t.name.toLowerCase().includes(q) && !GAMES[t.game]?.name.toLowerCase().includes(q)) return false;
    if (filters.game && filters.game !== 'all' && t.game !== filters.game) return false;
    if (filters.status && filters.status !== 'all') {
      const want = filters.status === 'upcoming' ? ['upcoming', 'closed'] : [filters.status];
      if (!want.includes(status)) return false;
    }
    if (filters.format && filters.format !== 'all' && t.format !== filters.format) return false;
    if (filters.fee === 'free' && t.entryFee > 0) return false;
    if (filters.fee === 'paid' && t.entryFee === 0) return false;
    return true;
  });

  const popularity = (t) => activeRegistrations(registrations, t.id).length / t.maxTeams;
  const sort = filters.sort ?? 'date';
  out.sort((a, b) => {
    if (sort === 'prize') return b.prizePool - a.prizePool;
    if (sort === 'popularity') return popularity(b) - popularity(a) || b.prizePool - a.prizePool;
    // date: actionable first (open → upcoming → ongoing → past), then soonest start; past ones most recent first
    const sa = STATUS_ORDER[getDisplayStatus(a, now)];
    const sb = STATUS_ORDER[getDisplayStatus(b, now)];
    if (sa !== sb) return sa - sb;
    const da = new Date(a.startAt) - new Date(b.startAt);
    return sa >= 3 ? -da : da;
  });
  return out;
}
