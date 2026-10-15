import { describe, it, expect } from 'vitest';
import { checkRegistration, checkWithdraw, getDisplayStatus, slotsLeft, rosterLimits } from '../registrationRules.js';

const NOW = new Date('2026-10-15T12:00:00Z').getTime();
const future = '2026-10-20T12:00:00Z';
const past = '2026-10-10T12:00:00Z';

const tournament = (o = {}) => ({ id: 't1', game: 'valorant', format: '5v5', maxTeams: 2, status: 'open', regDeadline: future, ...o });
const team = (o = {}) => ({ id: 'A', game: 'valorant', captainId: 'u1', ...o });
const roster = (teamId, n, prefix = 'p') => Array.from({ length: n }, (_, i) => ({ teamId, profileId: `${prefix}${i}` }));

const base = (o = {}) => ({ tournament: tournament(), team: team(), members: roster('A', 5), registrations: [], userId: 'u1', now: NOW, ...o });

describe('checkRegistration', () => {
  it('allows an eligible captain', () => {
    expect(checkRegistration(base())).toMatchObject({ ok: true });
  });

  it.each([
    ['NO_AUTH', { userId: null }],
    ['NOT_OPEN', { tournament: tournament({ status: 'upcoming' }) }],
    ['DEADLINE', { tournament: tournament({ regDeadline: past }) }],
    ['NO_TEAM', { team: null }],
    ['NOT_CAPTAIN', { userId: 'someone-else' }],
    ['WRONG_GAME', { team: team({ game: 'bgmi' }) }],
    ['TEAM_SIZE', { members: roster('A', 4) }],
    ['TEAM_SIZE', { members: roster('A', 8) }],
  ])('rejects with %s', (code, override) => {
    expect(checkRegistration(base(override)).code).toBe(code);
  });

  it('blocks duplicates', () => {
    const r = checkRegistration(base({ registrations: [{ tournamentId: 't1', teamId: 'A', status: 'pending' }] }));
    expect(r.code).toBe('DUPLICATE');
  });

  it('allows re-registering after a withdrawal', () => {
    const r = checkRegistration(base({ registrations: [{ tournamentId: 't1', teamId: 'A', status: 'withdrawn' }] }));
    expect(r.ok).toBe(true);
  });

  it('enforces capacity (pending + approved count, rejected does not)', () => {
    const regs = [
      { tournamentId: 't1', teamId: 'X', status: 'approved' },
      { tournamentId: 't1', teamId: 'Y', status: 'pending' },
    ];
    expect(checkRegistration(base({ registrations: regs })).code).toBe('FULL');
    regs[1].status = 'rejected';
    expect(checkRegistration(base({ registrations: regs })).ok).toBe(true);
  });

  it('blocks a player appearing on two registered rosters', () => {
    const members = [...roster('A', 5), { teamId: 'X', profileId: 'p0' }];
    const regs = [{ tournamentId: 't1', teamId: 'X', status: 'approved' }];
    expect(checkRegistration(base({ members, registrations: regs })).code).toBe('PLAYER_CONFLICT');
  });
});

describe('checkWithdraw', () => {
  const reg = { status: 'approved' };
  it('allows the captain before the deadline', () => {
    expect(checkWithdraw({ tournament: tournament(), registration: reg, team: team(), userId: 'u1', now: NOW }).ok).toBe(true);
  });
  it('locks after the deadline', () => {
    expect(checkWithdraw({ tournament: tournament({ regDeadline: past }), registration: reg, team: team(), userId: 'u1', now: NOW }).code).toBe('LOCKED');
  });
  it('rejects non-captains', () => {
    expect(checkWithdraw({ tournament: tournament(), registration: reg, team: team(), userId: 'u2', now: NOW }).code).toBe('NOT_CAPTAIN');
  });
});

describe('helpers', () => {
  it('shows closed once the deadline passes', () => {
    expect(getDisplayStatus(tournament({ regDeadline: past }), NOW)).toBe('closed');
    expect(getDisplayStatus(tournament(), NOW)).toBe('open');
  });
  it('counts remaining slots', () => {
    expect(slotsLeft(tournament(), [{ tournamentId: 't1', status: 'approved' }])).toBe(1);
  });
  it('knows roster limits per format', () => {
    expect(rosterLimits('5v5')).toEqual({ min: 5, max: 7 });
    expect(rosterLimits('duo')).toEqual({ min: 2, max: 3 });
  });
});
