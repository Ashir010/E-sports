import { describe, it, expect } from 'vitest';
import { validateEmail, validatePassword, validateUsername, validateTeam, validateTournament, validateSignup, validateInviteCode, hasErrors } from '../validation.js';
import { filterTournaments } from '../tournamentFilters.js';

describe('field validators', () => {
  it('validates email', () => {
    expect(validateEmail('a@b.co')).toBeNull();
    expect(validateEmail('nope')).toBeTruthy();
    expect(validateEmail('')).toBeTruthy();
  });
  it('validates password strength', () => {
    expect(validatePassword('short1')).toBeTruthy();
    expect(validatePassword('longenough')).toBeTruthy();
    expect(validatePassword('longenough1')).toBeNull();
  });
  it('validates usernames', () => {
    expect(validateUsername('kabir.gg')).toBeNull();
    expect(validateUsername('ab')).toBeTruthy();
    expect(validateUsername('has space')).toBeTruthy();
  });
  it('validates invite codes', () => {
    expect(validateInviteCode('PHX4KQ9Z')).toBeNull();
    expect(validateInviteCode('ab')).toBeTruthy();
  });
  it('skips password checks for demo signup', () => {
    const e = validateSignup({ email: 'a@b.co', username: 'abc', displayName: 'A', college: 'X' }, { requirePassword: false });
    expect(hasErrors(e)).toBe(false);
  });
});

describe('validateTeam', () => {
  const existing = [{ id: '1', name: 'Phantom Protocol', game: 'valorant' }];
  it('accepts a valid team', () => {
    expect(validateTeam({ name: 'New Squad', tag: 'NSQ', game: 'valorant' }, existing)).toEqual({});
  });
  it('rejects duplicate names within a game, case-insensitively', () => {
    expect(validateTeam({ name: 'phantom protocol', tag: 'PP', game: 'valorant' }, existing).name).toBeTruthy();
    expect(validateTeam({ name: 'phantom protocol', tag: 'PP', game: 'bgmi' }, existing).name).toBeUndefined();
    expect(validateTeam({ name: 'Phantom Protocol', tag: 'PP', game: 'valorant' }, existing, '1').name).toBeUndefined();
  });
  it('requires a proper tag', () => {
    expect(validateTeam({ name: 'Okay Name', tag: 'toolong', game: 'bgmi' }).tag).toBeTruthy();
  });
});

describe('validateTournament', () => {
  const ok = { name: 'Cup One', game: 'bgmi', format: 'squad', maxTeams: 8, entryFee: 0, prizePool: 100, regDeadline: '2026-11-01T00:00:00Z', startAt: '2026-11-05T00:00:00Z' };
  it('accepts a valid tournament', () => expect(validateTournament(ok)).toEqual({}));
  it('requires deadline before start', () => expect(validateTournament({ ...ok, regDeadline: '2026-11-09T00:00:00Z' }).regDeadline).toBeTruthy());
  it('requires at least two teams', () => expect(validateTournament({ ...ok, maxTeams: 1 }).maxTeams).toBeTruthy());
});

describe('filterTournaments', () => {
  const now = new Date('2026-10-15T00:00:00Z').getTime();
  const list = [
    { id: 'a', name: 'Alpha Cup', game: 'bgmi', format: 'squad', entryFee: 0, prizePool: 100, maxTeams: 4, status: 'open', regDeadline: '2026-10-20T00:00:00Z', startAt: '2026-10-25T00:00:00Z' },
    { id: 'b', name: 'Bravo League', game: 'valorant', format: '5v5', entryFee: 200, prizePool: 900, maxTeams: 4, status: 'completed', regDeadline: '2026-09-01T00:00:00Z', startAt: '2026-09-05T00:00:00Z' },
    { id: 'c', name: 'Charlie Open', game: 'valorant', format: '5v5', entryFee: 100, prizePool: 500, maxTeams: 2, status: 'open', regDeadline: '2026-10-10T00:00:00Z', startAt: '2026-10-30T00:00:00Z' },
  ];
  const regs = [{ tournamentId: 'c', status: 'approved' }, { tournamentId: 'c', status: 'approved' }];
  it('filters by game, fee and search', () => {
    expect(filterTournaments(list, { game: 'valorant' }, [], now).map((t) => t.id)).toEqual(['c', 'b']);
    expect(filterTournaments(list, { fee: 'free' }, [], now).map((t) => t.id)).toEqual(['a']);
    expect(filterTournaments(list, { q: 'league' }, [], now).map((t) => t.id)).toEqual(['b']);
  });
  it('treats an expired open tournament as upcoming/closed, not open', () => {
    expect(filterTournaments(list, { status: 'open' }, [], now).map((t) => t.id)).toEqual(['a']);
    expect(filterTournaments(list, { status: 'upcoming' }, [], now).map((t) => t.id)).toEqual(['c']);
  });
  it('sorts by prize and popularity', () => {
    expect(filterTournaments(list, { sort: 'prize' }, [], now)[0].id).toBe('b');
    expect(filterTournaments(list, { sort: 'popularity' }, regs, now)[0].id).toBe('c');
  });
});
