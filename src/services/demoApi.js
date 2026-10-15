/**
 * DEMO MODE implementation of the data API. Enforces the same business rules
 * as the Supabase SQL functions, but persists only to this browser.
 */
import { getDemoDb, mutate, uid, inviteCode, delay, getDemoSession, setDemoSession, resetDemoDb } from './demoStore.js';
import { checkRegistration, checkWithdraw, rosterLimits, activeRegistrations } from '../utils/registrationRules.js';
import { validateTeam, validateTournament, validateProfile, hasErrors } from '../utils/validation.js';
import { FORMATS, GAMES, TEAM_COLORS } from '../lib/constants.js';

class ApiError extends Error {}
const fail = (msg) => {
  throw new ApiError(msg);
};
const now = () => new Date().toISOString();

function requireProfile(d, userId) {
  const p = d.profiles.find((x) => x.id === userId);
  if (!p) fail('You need to be logged in.');
  return p;
}
function requireAdmin(d, userId) {
  const p = requireProfile(d, userId);
  if (p.role !== 'admin') fail('Admin permission required.');
  return p;
}
function requireCaptain(d, userId, teamId) {
  const team = d.teams.find((t) => t.id === teamId);
  if (!team) fail('Team not found.');
  if (team.captainId !== userId) fail('Only the team captain can do that.');
  return team;
}
function teamLocked(d, teamId) {
  // Roster changes are frozen while the team holds an active registration in a tournament that has closed registration.
  return d.registrations.some((r) => {
    if (r.teamId !== teamId || !['pending', 'approved'].includes(r.status)) return false;
    const t = d.tournaments.find((x) => x.id === r.tournamentId);
    return t && ['upcoming', 'ongoing'].includes(t.status);
  });
}
function log(d, type, message) {
  d.activity = [{ id: uid('a'), type, message, createdAt: now() }, ...(d.activity ?? [])].slice(0, 50);
}

export const demoApi = {
  mode: 'demo',

  async loadSnapshot() {
    await delay(300);
    return structuredClone(getDemoDb());
  },

  // ---------------- auth ----------------
  async getSessionUserId() {
    const id = getDemoSession();
    return id && getDemoDb().profiles.some((p) => p.id === id) ? id : null;
  },
  async demoLogin(profileId) {
    await delay(200);
    requireProfile(getDemoDb(), profileId);
    setDemoSession(profileId);
    return profileId;
  },
  async signUp({ email, username, displayName, college, favoriteGame }) {
    await delay(300);
    return mutate((d) => {
      if (d.profiles.some((p) => p.username.toLowerCase() === username.toLowerCase())) fail('That username is taken.');
      const id = uid('u');
      d.profiles.push({
        id,
        username,
        displayName,
        college,
        favoriteGame: favoriteGame || 'valorant',
        avatarColor: TEAM_COLORS[d.profiles.length % TEAM_COLORS.length],
        avatarUrl: null,
        gameIds: {},
        role: 'player',
        bio: '',
        createdAt: now(),
        demoEmail: email,
      });
      setDemoSession(id);
      return { userId: id, needsConfirmation: false };
    });
  },
  async signIn() {
    fail('Email/password login needs Supabase. In demo mode, use one of the demo accounts or create a demo profile.');
  },
  async signOut() {
    setDemoSession(null);
  },
  async resetPassword() {
    fail('Password reset emails need Supabase configured. Demo accounts have no password.');
  },
  async updatePassword() {
    fail('Passwords are managed by Supabase Auth and are not available in demo mode.');
  },
  async resetDemo() {
    resetDemoDb();
  },

  // ---------------- profiles ----------------
  async updateProfile(userId, patch) {
    await delay();
    return mutate((d) => {
      const p = requireProfile(d, userId);
      const errors = validateProfile({ ...p, ...patch }, d.profiles, userId);
      if (hasErrors(errors)) fail(Object.values(errors)[0]);
      const { role, id, ...safe } = patch; // role/id are never self-editable
      Object.assign(p, safe, { updatedAt: now() });
      return p;
    });
  },
  async setRole(adminId, profileId, role) {
    await delay();
    return mutate((d) => {
      requireAdmin(d, adminId);
      if (adminId === profileId && role !== 'admin') fail('You cannot remove your own admin role.');
      const p = requireProfile(d, profileId);
      p.role = role;
      log(d, 'player', `${p.username} is now ${role === 'admin' ? 'an admin' : 'a player'}`);
    });
  },
  async uploadImage(file) {
    return resizeToDataUrl(file, 192);
  },

  // ---------------- teams ----------------
  async createTeam(userId, { name, tag, game, color, logoUrl, college, inGameId }) {
    await delay();
    return mutate((d) => {
      const p = requireProfile(d, userId);
      const errors = validateTeam({ name, tag, game }, d.teams);
      if (hasErrors(errors)) fail(Object.values(errors)[0]);
      if (!inGameId?.trim()) fail('Enter your in-game ID.');
      const ownsSameGame = d.members.some((m) => m.profileId === userId && d.teams.find((t) => t.id === m.teamId)?.game === game);
      if (ownsSameGame) fail('You are already on a team for this game. Leave it first.');
      const team = {
        id: uid('tm'),
        name: name.trim(),
        tag,
        game,
        color: color || TEAM_COLORS[0],
        logoUrl: logoUrl || null,
        captainId: userId,
        inviteCode: inviteCode(),
        college: college || p.college,
        createdAt: now(),
      };
      d.teams.push(team);
      d.members.push({ id: uid('m'), teamId: team.id, profileId: userId, inGameId: inGameId.trim(), role: 'captain', joinedAt: now() });
      p.gameIds = { ...p.gameIds, [game]: inGameId.trim() };
      log(d, 'team', `New team created: ${team.name}`);
      return team;
    });
  },
  async updateTeam(userId, teamId, patch) {
    await delay();
    return mutate((d) => {
      const team = requireCaptain(d, userId, teamId);
      const next = { ...team, ...patch, game: team.game };
      const errors = validateTeam(next, d.teams, teamId);
      if (hasErrors(errors)) fail(Object.values(errors)[0]);
      Object.assign(team, { name: next.name.trim(), tag: next.tag, color: next.color, logoUrl: next.logoUrl ?? null, college: next.college });
      return team;
    });
  },
  async joinTeam(userId, code, inGameId) {
    await delay();
    return mutate((d) => {
      requireProfile(d, userId);
      const team = d.teams.find((t) => t.inviteCode === code.trim().toUpperCase());
      if (!team) fail('Invite code not found. Check it with your captain.');
      if (!inGameId?.trim()) fail('Enter your in-game ID.');
      if (d.members.some((m) => m.teamId === team.id && m.profileId === userId)) fail('You are already on this team.');
      const sameGame = d.members.some((m) => m.profileId === userId && d.teams.find((t) => t.id === m.teamId)?.game === team.game);
      if (sameGame) fail('You are already on another team for this game.');
      if (teamLocked(d, team.id)) fail('This team’s roster is locked while it is competing.');
      const count = d.members.filter((m) => m.teamId === team.id).length;
      if (count >= rosterLimits(GAMES[team.game].defaultFormat).max) fail('This team’s roster is full.');
      d.members.push({ id: uid('m'), teamId: team.id, profileId: userId, inGameId: inGameId.trim(), role: 'player', joinedAt: now() });
      const p = d.profiles.find((x) => x.id === userId);
      p.gameIds = { ...p.gameIds, [team.game]: inGameId.trim() };
      return team;
    });
  },
  async leaveTeam(userId, teamId) {
    await delay();
    return mutate((d) => {
      const team = d.teams.find((t) => t.id === teamId);
      if (!team) fail('Team not found.');
      if (team.captainId === userId) fail('Captains must transfer captaincy before leaving.');
      if (teamLocked(d, teamId)) fail('Roster is locked while the team is competing.');
      d.members = d.members.filter((m) => !(m.teamId === teamId && m.profileId === userId));
    });
  },
  async removeMember(userId, teamId, profileId) {
    await delay();
    return mutate((d) => {
      const team = requireCaptain(d, userId, teamId);
      if (profileId === team.captainId) fail('The captain cannot be removed.');
      if (teamLocked(d, teamId)) fail('Roster is locked while the team is competing.');
      d.members = d.members.filter((m) => !(m.teamId === teamId && m.profileId === profileId));
    });
  },
  async transferCaptain(userId, teamId, profileId) {
    await delay();
    return mutate((d) => {
      const team = requireCaptain(d, userId, teamId);
      const target = d.members.find((m) => m.teamId === teamId && m.profileId === profileId);
      if (!target) fail('That player is not on this team.');
      d.members.forEach((m) => {
        if (m.teamId === teamId) m.role = m.profileId === profileId ? 'captain' : 'player';
      });
      team.captainId = profileId;
    });
  },
  async regenerateInvite(userId, teamId) {
    await delay();
    return mutate((d) => {
      const team = requireCaptain(d, userId, teamId);
      team.inviteCode = inviteCode();
      return team.inviteCode;
    });
  },
  async deleteTeam(userId, teamId) {
    await delay();
    return mutate((d) => {
      const p = requireProfile(d, userId);
      const team = d.teams.find((t) => t.id === teamId);
      if (!team) fail('Team not found.');
      if (p.role !== 'admin' && team.captainId !== userId) fail('Only the captain or an admin can delete a team.');
      if (d.results.some((r) => r.teamId === teamId)) fail('Teams with match history cannot be deleted.');
      if (activeRegistrationsForTeam(d, teamId).length) fail('Withdraw from active tournaments first.');
      d.teams = d.teams.filter((t) => t.id !== teamId);
      d.members = d.members.filter((m) => m.teamId !== teamId);
      d.registrations = d.registrations.filter((r) => r.teamId !== teamId);
    });
  },

  // ---------------- registrations ----------------
  async registerTeam(userId, tournamentId, teamId) {
    await delay();
    return mutate((d) => {
      const tournament = d.tournaments.find((t) => t.id === tournamentId);
      const team = d.teams.find((t) => t.id === teamId);
      if (!tournament) fail('Tournament not found.');
      const check = checkRegistration({ tournament, team, members: d.members, registrations: d.registrations, userId });
      if (!check.ok) fail(check.message);
      const existing = d.registrations.find((r) => r.tournamentId === tournamentId && r.teamId === teamId);
      const status = tournament.requiresApproval ? 'pending' : 'approved';
      if (existing) Object.assign(existing, { status, updatedAt: now() });
      else d.registrations.push({ id: uid('r'), tournamentId, teamId, status, createdAt: now(), updatedAt: now() });
      log(d, 'registration', `${team.name} registered for ${tournament.name}`);
      return status;
    });
  },
  async withdrawRegistration(userId, registrationId) {
    await delay();
    return mutate((d) => {
      const registration = d.registrations.find((r) => r.id === registrationId);
      if (!registration) fail('Registration not found.');
      const tournament = d.tournaments.find((t) => t.id === registration.tournamentId);
      const team = d.teams.find((t) => t.id === registration.teamId);
      const check = checkWithdraw({ tournament, registration, team, userId });
      if (!check.ok) fail(check.message);
      registration.status = 'withdrawn';
      registration.updatedAt = now();
      log(d, 'registration', `${team.name} withdrew from ${tournament.name}`);
    });
  },
  async setRegistrationStatus(adminId, registrationId, status) {
    await delay();
    return mutate((d) => {
      requireAdmin(d, adminId);
      const r = d.registrations.find((x) => x.id === registrationId);
      if (!r) fail('Registration not found.');
      const t = d.tournaments.find((x) => x.id === r.tournamentId);
      if (status === 'approved' && r.status !== 'approved') {
        const approved = d.registrations.filter((x) => x.tournamentId === t.id && x.status === 'approved').length;
        if (approved >= t.maxTeams) fail('Tournament capacity reached.');
      }
      r.status = status;
      r.updatedAt = now();
      const team = d.teams.find((x) => x.id === r.teamId);
      log(d, 'registration', `${team?.name} ${status} for ${t.name}`);
    });
  },

  // ---------------- tournaments ----------------
  async saveTournament(adminId, data) {
    await delay();
    return mutate((d) => {
      requireAdmin(d, adminId);
      const errors = validateTournament(data);
      if (hasErrors(errors)) fail(Object.values(errors)[0]);
      const record = {
        ...data,
        name: data.name.trim(),
        maxTeams: Number(data.maxTeams),
        entryFee: Number(data.entryFee),
        prizePool: Number(data.prizePool),
        teamSize: FORMATS[data.format].teamSize,
        updatedAt: now(),
      };
      if (data.id) {
        const t = d.tournaments.find((x) => x.id === data.id);
        if (!t) fail('Tournament not found.');
        const active = activeRegistrations(d.registrations, t.id).length;
        if (record.maxTeams < active) fail(`${active} teams are already registered — capacity cannot go below that.`);
        Object.assign(t, record);
        log(d, 'tournament', `Tournament updated: ${t.name}`);
        return t;
      }
      const t = { ...record, id: uid('t'), createdAt: now() };
      d.tournaments.push(t);
      log(d, 'tournament', `Tournament created: ${t.name}`);
      return t;
    });
  },
  async setTournamentStatus(adminId, tournamentId, status) {
    await delay();
    return mutate((d) => {
      requireAdmin(d, adminId);
      const t = d.tournaments.find((x) => x.id === tournamentId);
      if (!t) fail('Tournament not found.');
      t.status = status;
      t.updatedAt = now();
      log(d, 'tournament', `${t.name} → ${status}`);
    });
  },

  // ---------------- matches ----------------
  async saveMatch(adminId, data) {
    await delay();
    return mutate((d) => {
      requireAdmin(d, adminId);
      if (!data.tournamentId) fail('Select a tournament.');
      if (!data.scheduledAt) fail('Set the match date and time.');
      if (!data.round?.trim()) fail('Enter a round name.');
      const participants = [...new Set(data.participants ?? [])];
      const t = d.tournaments.find((x) => x.id === data.tournamentId);
      const approved = new Set(d.registrations.filter((r) => r.tournamentId === t.id && r.status === 'approved').map((r) => r.teamId));
      if (participants.some((p) => !approved.has(p))) fail('Only approved teams can be scheduled.');
      if (participants.length < 2 && data.status !== 'scheduled') fail('Pick at least two teams.');
      const record = { tournamentId: data.tournamentId, round: data.round.trim(), participants, scheduledAt: data.scheduledAt, status: data.status ?? 'scheduled', map: data.map ?? '' };
      if (data.id) {
        const m = d.matches.find((x) => x.id === data.id);
        if (!m) fail('Match not found.');
        Object.assign(m, record);
        d.results = d.results.filter((r) => r.matchId !== m.id || participants.includes(r.teamId));
        return m;
      }
      const m = { ...record, id: uid('mt') };
      d.matches.push(m);
      log(d, 'match', `Match scheduled: ${t.name} · ${m.round}`);
      return m;
    });
  },
  async deleteMatch(adminId, matchId) {
    await delay();
    return mutate((d) => {
      requireAdmin(d, adminId);
      d.matches = d.matches.filter((m) => m.id !== matchId);
      d.results = d.results.filter((r) => r.matchId !== matchId);
    });
  },
  async saveResults(adminId, matchId, results) {
    await delay();
    return mutate((d) => {
      requireAdmin(d, adminId);
      const m = d.matches.find((x) => x.id === matchId);
      if (!m) fail('Match not found.');
      if (results.some((r) => !m.participants.includes(r.teamId))) fail('Results include a team not in this match.');
      if (results.length !== m.participants.length) fail('Enter a result for every team.');
      d.results = d.results.filter((r) => r.matchId !== matchId);
      results.forEach((r) => d.results.push({ id: uid('res'), matchId, teamId: r.teamId, score: r.score ?? null, placement: r.placement ?? null, kills: r.kills ?? null, isWinner: !!r.isWinner }));
      m.status = 'completed';
      const t = d.tournaments.find((x) => x.id === m.tournamentId);
      log(d, 'result', `Result posted: ${t?.name} · ${m.round}`);
    });
  },
};

function activeRegistrationsForTeam(d, teamId) {
  return d.registrations.filter((r) => r.teamId === teamId && ['pending', 'approved'].includes(r.status));
}

export function resizeToDataUrl(file, size) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new ApiError('Please choose an image file.'));
    if (file.size > 5 * 1024 * 1024) return reject(new ApiError('Image must be under 5 MB.'));
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/webp', 0.85));
    };
    img.onerror = () => reject(new ApiError('Could not read that image.'));
    img.src = url;
  });
}
