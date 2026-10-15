import { computeStandings, computePlayerStandings, tournamentChampion, groupBy } from './scoring.js';
import { activeRegistrations } from './registrationRules.js';

export const byId = (list, id) => list.find((x) => x.id === id) ?? null;

export function publicTournaments(db, isAdmin = false) {
  return db.tournaments.filter((t) => isAdmin || t.status !== 'draft');
}

export function teamMembers(db, teamId) {
  return db.members
    .filter((m) => m.teamId === teamId)
    .map((m) => ({ ...m, profile: byId(db.profiles, m.profileId) }))
    .sort((a, b) => (a.role === 'captain' ? -1 : b.role === 'captain' ? 1 : 0));
}

export function teamsForUser(db, userId) {
  const ids = new Set(db.members.filter((m) => m.profileId === userId).map((m) => m.teamId));
  return db.teams.filter((t) => ids.has(t.id));
}

export function registeredTeams(db, tournamentId) {
  return activeRegistrations(db.registrations, tournamentId)
    .map((r) => ({ registration: r, team: byId(db.teams, r.teamId) }))
    .filter((x) => x.team);
}

export function matchesForTournament(db, tournamentId) {
  return db.matches.filter((m) => m.tournamentId === tournamentId).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
}

export function matchesForTeam(db, teamId) {
  return db.matches.filter((m) => m.participants.includes(teamId)).sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));
}

export function resultsForMatch(db, matchId) {
  return db.results.filter((r) => r.matchId === matchId);
}

/** Matches sorted for "what's next": in-progress first, then soonest scheduled. */
export function upcomingMatches(db, limit = 6) {
  const live = db.matches.filter((m) => m.status === 'in_progress');
  const next = db.matches
    .filter((m) => m.status === 'scheduled' && new Date(m.scheduledAt).getTime() > Date.now() - 3 * 3600000)
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  return [...live, ...next].filter((m) => byId(db.tournaments, m.tournamentId)?.status !== 'draft').slice(0, limit);
}

export function platformStats(db) {
  const players = new Set(db.members.map((m) => m.profileId)).size;
  return {
    tournaments: db.tournaments.filter((t) => t.status !== 'draft').length,
    players,
    teams: db.teams.length,
    prizePool: db.tournaments.filter((t) => !['draft', 'cancelled'].includes(t.status)).reduce((s, t) => s + t.prizePool, 0),
    completedMatches: db.matches.filter((m) => m.status === 'completed').length,
    activeTournaments: db.tournaments.filter((t) => ['open', 'upcoming', 'ongoing'].includes(t.status)).length,
    pendingRegistrations: db.registrations.filter((r) => r.status === 'pending').length,
  };
}

/** Stats for one player, derived from their teams' match results. */
export function playerStats(db, profileId) {
  const row = computePlayerStandings(db).find((r) => r.profileId === profileId);
  const teamIds = new Set(db.members.filter((m) => m.profileId === profileId).map((m) => m.teamId));
  const tournamentsJoined = new Set(db.registrations.filter((r) => teamIds.has(r.teamId) && r.status === 'approved').map((r) => r.tournamentId));
  return {
    rank: row?.rank ?? null,
    played: row?.played ?? 0,
    wins: row?.wins ?? 0,
    losses: (row?.losses ?? 0) + (row?.draws ?? 0),
    points: row?.points ?? 0,
    winRate: row?.winRate ?? 0,
    tournaments: tournamentsJoined.size,
  };
}

export function matchHistoryForPlayer(db, profileId) {
  const teamIds = new Set(db.members.filter((m) => m.profileId === profileId).map((m) => m.teamId));
  return db.matches
    .filter((m) => m.status === 'completed' && m.participants.some((p) => teamIds.has(p)))
    .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))
    .map((m) => {
      const teamId = m.participants.find((p) => teamIds.has(p));
      const res = db.results.find((r) => r.matchId === m.id && r.teamId === teamId);
      return { match: m, teamId, result: res };
    });
}

/** Achievements are computed from real records — never manually granted in the UI. */
export function achievementsFor(db, profileId) {
  const list = [];
  const teamIds = new Set(db.members.filter((m) => m.profileId === profileId).map((m) => m.teamId));
  const stats = playerStats(db, profileId);
  for (const t of db.tournaments) {
    const champ = tournamentChampion(db, t);
    if (champ && teamIds.has(champ.teamId)) list.push({ id: `champ-${t.id}`, icon: 'trophy', title: 'Champion', detail: t.name });
  }
  if (db.teams.some((t) => t.captainId === profileId)) list.push({ id: 'captain', icon: 'crown', title: 'Team Captain', detail: 'Leads a registered roster' });
  if (stats.played >= 1) list.push({ id: 'debut', icon: 'swords', title: 'First Blood', detail: 'Played a competitive match' });
  if (stats.played >= 10) list.push({ id: 'veteran', icon: 'shield', title: 'Veteran', detail: '10+ matches played' });
  if (stats.wins >= 5) list.push({ id: 'closer', icon: 'flame', title: 'Closer', detail: '5+ match wins' });
  if (stats.played >= 3 && stats.winRate >= 0.6) list.push({ id: 'elite', icon: 'zap', title: 'Elite Form', detail: '60%+ win rate' });
  return list;
}

/** Derived activity feed for when no stored log exists. */
export function activityFeed(db, limit = 8) {
  if (db.activity?.length) return [...db.activity].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
  const items = [];
  db.registrations.forEach((r) => {
    const team = byId(db.teams, r.teamId);
    const t = byId(db.tournaments, r.tournamentId);
    if (team && t) items.push({ id: `r${r.id}`, type: 'registration', message: `${team.name} — ${r.status} for ${t.name}`, createdAt: r.updatedAt ?? r.createdAt });
  });
  db.tournaments.forEach((t) => items.push({ id: `t${t.id}`, type: 'tournament', message: `Tournament created: ${t.name}`, createdAt: t.createdAt }));
  return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
}

/** Featured players: top of the player standings with a team. */
export function spotlightPlayers(db, limit = 4) {
  const rows = computePlayerStandings(db);
  const seenTeams = new Set();
  const out = [];
  for (const r of rows) {
    const teamId = r.teamIds[0];
    if (seenTeams.has(teamId)) continue;
    seenTeams.add(teamId);
    const profile = byId(db.profiles, r.profileId);
    out.push({ ...r, profile, team: byId(db.teams, teamId) });
    if (out.length >= limit) break;
  }
  return out;
}

export function gameBreakdown(db) {
  const byGame = groupBy(db.teams, 'game');
  return [...byGame.entries()].map(([game, teams]) => ({ game, teams: teams.length }));
}

export { computeStandings };
