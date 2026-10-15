import { FORMATS } from '../lib/constants.js';

export const ACTIVE_REG = ['pending', 'approved'];

/** Status shown to users. 'open' becomes 'closed' automatically after the deadline. */
export function getDisplayStatus(tournament, now = Date.now()) {
  if (tournament.status === 'open' && new Date(tournament.regDeadline).getTime() <= now) return 'closed';
  return tournament.status;
}

export const DISPLAY_STATUS_LABEL = {
  draft: 'Draft',
  open: 'Registration Open',
  closed: 'Registration Closed',
  upcoming: 'Upcoming',
  ongoing: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function activeRegistrations(registrations, tournamentId) {
  return registrations.filter((r) => r.tournamentId === tournamentId && ACTIVE_REG.includes(r.status));
}

export function slotsLeft(tournament, registrations) {
  return Math.max(0, tournament.maxTeams - activeRegistrations(registrations, tournament.id).length);
}

/** Allowed roster size for a format: required players plus optional substitutes. */
export function rosterLimits(format) {
  const f = FORMATS[format] ?? FORMATS.squad;
  return { min: f.teamSize, max: f.teamSize + f.maxSubs };
}

/**
 * Client-side mirror of the eligibility checks. The same checks are enforced
 * atomically by the `register_team` SQL function in Supabase mode.
 * Returns { ok, code, message }.
 */
export function checkRegistration({ tournament, team, members = [], registrations = [], userId, now = Date.now() }) {
  if (!userId) return fail('NO_AUTH', 'Log in to register a team.');
  if (tournament.status !== 'open') return fail('NOT_OPEN', 'Registration is not open for this tournament.');
  if (new Date(tournament.regDeadline).getTime() <= now) return fail('DEADLINE', 'The registration deadline has passed.');
  const active = activeRegistrations(registrations, tournament.id);
  if (!team) return fail('NO_TEAM', 'Create or join a team for this game first.');
  if (team.captainId !== userId) return fail('NOT_CAPTAIN', 'Only the team captain can register the team.');
  if (team.game !== tournament.game) return fail('WRONG_GAME', 'This team plays a different game.');
  if (active.some((r) => r.teamId === team.id)) return fail('DUPLICATE', 'This team is already registered.');
  if (active.length >= tournament.maxTeams) return fail('FULL', 'All team slots are filled.');

  const roster = members.filter((m) => m.teamId === team.id);
  const { min, max } = rosterLimits(tournament.format);
  if (roster.length < min) return fail('TEAM_SIZE', `Needs at least ${min} player${min > 1 ? 's' : ''} — roster has ${roster.length}.`);
  if (roster.length > max) return fail('TEAM_SIZE', `Roster too large: maximum ${max} including substitutes.`);

  const registeredTeamIds = new Set(active.map((r) => r.teamId));
  const rosterIds = new Set(roster.map((r) => r.profileId));
  const conflict = members.some((m) => registeredTeamIds.has(m.teamId) && rosterIds.has(m.profileId));
  if (conflict) return fail('PLAYER_CONFLICT', 'A player on your roster is already registered with another team in this tournament.');

  return { ok: true, code: 'OK', message: 'Eligible to register.' };
}

/** Withdrawal is allowed only for the captain, while registration is still open. */
export function checkWithdraw({ tournament, registration, team, userId, now = Date.now() }) {
  if (!registration || !ACTIVE_REG.includes(registration.status)) return fail('NOT_REGISTERED', 'No active registration.');
  if (!team || team.captainId !== userId) return fail('NOT_CAPTAIN', 'Only the captain can withdraw the team.');
  if (tournament.status !== 'open' || new Date(tournament.regDeadline).getTime() <= now) {
    return fail('LOCKED', 'Withdrawals close at the registration deadline.');
  }
  return { ok: true, code: 'OK', message: 'Withdrawal allowed.' };
}

function fail(code, message) {
  return { ok: false, code, message };
}
