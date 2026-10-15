import { describe, it, expect } from 'vitest';
import { scoreResult, scoreCircuit, computeStandings, withMovement, computePlayerStandings, tournamentChampion } from '../scoring.js';

const H2H = { type: 'h2h', win: 3, draw: 1, loss: 0 };
const BR = { type: 'br', killPoints: 1, placementPoints: [10, 6, 3, 1] };

function db() {
  return {
    tournaments: [
      { id: 'v', game: 'valorant', status: 'completed', scoringRules: H2H },
      { id: 'b', game: 'bgmi', status: 'ongoing', scoringRules: BR },
      { id: 'x', game: 'valorant', status: 'cancelled', scoringRules: H2H },
    ],
    teams: [
      { id: 'A', name: 'Alpha' },
      { id: 'B', name: 'Bravo' },
      { id: 'C', name: 'Charlie' },
      { id: 'D', name: 'Delta' },
    ],
    matches: [
      { id: 'm1', tournamentId: 'v', status: 'completed', scheduledAt: '2026-01-01T12:00:00Z', participants: ['A', 'B'] },
      { id: 'm2', tournamentId: 'v', status: 'completed', scheduledAt: '2026-01-02T12:00:00Z', participants: ['A', 'C'] },
      { id: 'm3', tournamentId: 'v', status: 'scheduled', scheduledAt: '2026-01-03T12:00:00Z', participants: ['B', 'C'] },
      { id: 'm4', tournamentId: 'b', status: 'completed', scheduledAt: '2026-01-05T12:00:00Z', participants: ['A', 'B', 'C', 'D'] },
      { id: 'm5', tournamentId: 'x', status: 'completed', scheduledAt: '2026-01-04T12:00:00Z', participants: ['C', 'D'] },
    ],
    results: [
      { matchId: 'm1', teamId: 'A', score: 13, isWinner: true },
      { matchId: 'm1', teamId: 'B', score: 7, isWinner: false },
      { matchId: 'm2', teamId: 'A', score: 12, isWinner: false },
      { matchId: 'm2', teamId: 'C', score: 12, isWinner: false },
      { matchId: 'm4', teamId: 'D', placement: 1, kills: 5, isWinner: true },
      { matchId: 'm4', teamId: 'B', placement: 2, kills: 8, isWinner: false },
      { matchId: 'm4', teamId: 'A', placement: 3, kills: 0, isWinner: false },
      { matchId: 'm4', teamId: 'C', placement: 4, kills: 1, isWinner: false },
      { matchId: 'm5', teamId: 'C', score: 13, isWinner: true },
      { matchId: 'm5', teamId: 'D', score: 0, isWinner: false },
    ],
    members: [
      { teamId: 'A', profileId: 'p1' },
      { teamId: 'B', profileId: 'p2' },
      { teamId: 'D', profileId: 'p2' },
    ],
    profiles: [
      { id: 'p1', username: 'one' },
      { id: 'p2', username: 'two' },
    ],
  };
}

describe('scoreResult', () => {
  it('scores head-to-head win, draw and loss', () => {
    expect(scoreResult({ isWinner: true }, H2H, [{ isWinner: true }])).toEqual({ points: 3, outcome: 'win' });
    expect(scoreResult({ isWinner: false }, H2H, [{ isWinner: true }, { isWinner: false }])).toEqual({ points: 0, outcome: 'loss' });
    expect(scoreResult({ isWinner: false }, H2H, [{ isWinner: false }, { isWinner: false }])).toEqual({ points: 1, outcome: 'draw' });
  });

  it('scores battle royale as placement + kills', () => {
    expect(scoreResult({ placement: 1, kills: 4 }, BR)).toEqual({ points: 14, outcome: 'win' });
    expect(scoreResult({ placement: 3, kills: 2 }, BR)).toEqual({ points: 5, outcome: 'loss' });
    expect(scoreResult({ placement: 9, kills: 1 }, BR).points).toBe(1); // beyond table = 0 placement pts
  });

  it('circuit points normalise BR finishes', () => {
    const lobby = [{}, {}, {}, {}];
    expect(scoreCircuit({ placement: 1 }, BR, lobby).points).toBe(3);
    expect(scoreCircuit({ placement: 2 }, BR, lobby).points).toBe(1);
    expect(scoreCircuit({ placement: 3 }, BR, lobby).points).toBe(0);
  });
});

describe('computeStandings', () => {
  it('derives a per-tournament table from completed results only', () => {
    const rows = computeStandings(db(), { tournamentId: 'v' });
    const a = rows.find((r) => r.teamId === 'A');
    expect(a).toMatchObject({ played: 2, wins: 1, draws: 1, losses: 0, points: 4, rank: 1 });
    expect(rows.find((r) => r.teamId === 'B')).toMatchObject({ played: 1, points: 0 });
    expect(rows.some((r) => r.played === 0)).toBe(false); // the scheduled m3 is ignored
  });

  it('ignores cancelled tournaments', () => {
    const rows = computeStandings(db(), { game: 'valorant' });
    expect(rows.find((r) => r.teamId === 'D')).toBeUndefined();
    expect(rows.find((r) => r.teamId === 'C').wins).toBe(0);
  });

  it('uses tournament BR rules inside a game filter', () => {
    const rows = computeStandings(db(), { game: 'bgmi' });
    // D: 10+5=15, B: 6+8=14, A: 3+0=3, C: 1+1=2
    expect(rows.map((r) => [r.teamId, r.points])).toEqual([['D', 15], ['B', 14], ['A', 3], ['C', 2]]);
  });

  it('uses circuit points for the overall table', () => {
    const rows = computeStandings(db());
    // A: win(3) + draw(1) + BR 3rd of 4 (0) = 4 ; D: BR win 3 ; B: BR 2nd (1) ; C: draw 1
    expect(rows.find((r) => r.teamId === 'A').points).toBe(4);
    expect(rows.find((r) => r.teamId === 'D').points).toBe(3);
    expect(rows[0].teamId).toBe('A');
  });

  it('respects the before filter', () => {
    const rows = computeStandings(db(), { tournamentId: 'v', before: '2026-01-02T00:00:00Z' });
    expect(rows.find((r) => r.teamId === 'A').played).toBe(1);
  });
});

describe('withMovement / players / champion', () => {
  it('reports movement against the previous match day', () => {
    const rows = withMovement(db());
    expect(rows.every((r) => 'movement' in r)).toBe(true);
    expect(rows.find((r) => r.teamId === 'D').isNew).toBe(true);
  });

  it('credits players with all their teams results', () => {
    const rows = computePlayerStandings(db());
    const two = rows.find((r) => r.profileId === 'p2');
    expect(two.teamIds).toEqual(['B', 'D']);
    expect(two.played).toBe(3);
  });

  it('names a champion only for completed tournaments', () => {
    const d = db();
    expect(tournamentChampion(d, d.tournaments[0]).teamId).toBe('A');
    expect(tournamentChampion(d, d.tournaments[1])).toBeNull();
  });
});
