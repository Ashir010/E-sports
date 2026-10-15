import { describe, it, expect, beforeEach } from 'vitest';
import { demoApi } from '../demoApi.js';
import { resetDemoDb, getDemoDb } from '../demoStore.js';
import { generateDemoData } from '../../data/demo/seed.js';
import { rosterLimits } from '../../utils/registrationRules.js';
import { GAMES } from '../../lib/constants.js';

const CAPTAIN = 'u-demo-captain';
const PLAYER = 'u-demo-player';
const ADMIN = 'u-demo-admin';

describe('demo data integrity', () => {
  const d = generateDemoData(new Date('2026-10-15T06:00:00Z').getTime());
  it('has unique ids and usernames', () => {
    for (const key of ['profiles', 'teams', 'members', 'tournaments', 'registrations', 'matches', 'results']) {
      const ids = d[key].map((x) => x.id);
      expect(new Set(ids).size, key).toBe(ids.length);
    }
    const names = d.profiles.map((p) => p.username.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });
  it('keeps every roster within its format limits', () => {
    for (const t of d.teams) {
      const n = d.members.filter((m) => m.teamId === t.id).length;
      const { min, max } = rosterLimits(GAMES[t.game].defaultFormat);
      expect(n).toBeGreaterThanOrEqual(min);
      expect(n).toBeLessThanOrEqual(max);
    }
  });
  it('only schedules approved teams and results reference participants', () => {
    for (const m of d.matches) {
      for (const teamId of m.participants) {
        expect(d.registrations.some((r) => r.tournamentId === m.tournamentId && r.teamId === teamId && r.status === 'approved')).toBe(true);
      }
    }
    for (const r of d.results) expect(d.matches.find((m) => m.id === r.matchId).participants).toContain(r.teamId);
  });
  it('never exceeds tournament capacity', () => {
    for (const t of d.tournaments) {
      const active = d.registrations.filter((r) => r.tournamentId === t.id && ['pending', 'approved'].includes(r.status)).length;
      expect(active).toBeLessThanOrEqual(t.maxTeams);
    }
  });
});

describe('demo API business rules', () => {
  beforeEach(() => resetDemoDb());

  it('lets the demo captain register for an open tournament, once', async () => {
    const status = await demoApi.registerTeam(CAPTAIN, 't-val-clash', 'tm-phantom');
    expect(status).toBe('pending'); // this tournament requires approval
    await expect(demoApi.registerTeam(CAPTAIN, 't-val-clash', 'tm-phantom')).rejects.toThrow(/already registered/);
  });

  it('rejects registration from a non-captain', async () => {
    await expect(demoApi.registerTeam(PLAYER, 't-val-clash', 'tm-neon')).rejects.toThrow(/captain/);
  });

  it('rejects registration when the tournament is full', async () => {
    const d = getDemoDb();
    const ff = d.teams.find((t) => t.game === 'freefire');
    await expect(demoApi.registerTeam(ff.captainId, 't-ff-booyah', ff.id)).rejects.toThrow(/already registered|full/);
  });

  it('rejects registration after the deadline', async () => {
    await expect(demoApi.registerTeam(CAPTAIN, 't-mm-duel', 'tm-phantom')).rejects.toThrow(/not open/);
  });

  it('rejects an undersized team', async () => {
    const team = await demoApi.createTeam(PLAYER, { name: 'Solo Squad', tag: 'SOLO', game: 'bgmi', inGameId: '5123456789' });
    await expect(demoApi.registerTeam(PLAYER, 't-bgmi-showdown', team.id)).rejects.toThrow(/at least 4/);
  });

  it('supports invite-code joins and withdrawals', async () => {
    const team = await demoApi.createTeam(PLAYER, { name: 'Code Crew', tag: 'CC', game: 'minimilitia', inGameId: 'ananya' });
    await demoApi.joinTeam(CAPTAIN, team.inviteCode.toLowerCase(), 'kabirMM');
    expect(getDemoDb().members.filter((m) => m.teamId === team.id)).toHaveLength(2);
    await expect(demoApi.joinTeam(CAPTAIN, team.inviteCode, 'again')).rejects.toThrow(/already on this team/);

    await demoApi.registerTeam(CAPTAIN, 't-val-clash', 'tm-phantom');
    const reg = getDemoDb().registrations.find((r) => r.tournamentId === 't-val-clash' && r.teamId === 'tm-phantom');
    await expect(demoApi.withdrawRegistration(PLAYER, reg.id)).rejects.toThrow(/captain/);
    await demoApi.withdrawRegistration(CAPTAIN, reg.id);
    expect(getDemoDb().registrations.find((r) => r.id === reg.id).status).toBe('withdrawn');
  });

  it('blocks non-admins from admin actions', async () => {
    await expect(demoApi.setTournamentStatus(CAPTAIN, 't-val-clash', 'cancelled')).rejects.toThrow(/Admin/);
    await expect(demoApi.setRole(PLAYER, PLAYER, 'admin')).rejects.toThrow(/Admin/);
    await expect(demoApi.updateProfile(PLAYER, { role: 'admin', displayName: 'X', username: 'ananya.exe', college: 'BITS' })).resolves.toBeTruthy();
    expect(getDemoDb().profiles.find((p) => p.id === PLAYER).role).toBe('player'); // role ignored on self-update
  });

  it('admin results move standings', async () => {
    const m = getDemoDb().matches.find((x) => x.status === 'in_progress');
    const [a, b] = m.participants;
    await demoApi.saveResults(ADMIN, m.id, [
      { teamId: a, score: 13, isWinner: true },
      { teamId: b, score: 4, isWinner: false },
    ]);
    const after = getDemoDb();
    expect(after.matches.find((x) => x.id === m.id).status).toBe('completed');
    expect(after.results.filter((r) => r.matchId === m.id)).toHaveLength(2);
  });
});
