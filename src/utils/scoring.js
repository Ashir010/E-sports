/**
 * Standings are always DERIVED from stored match results + each tournament's
 * scoring rules. Nothing here stores or hand-edits displayed points.
 *
 * Head-to-head (Valorant, Mini Militia):  points = win | draw | loss value.
 * Battle royale (BGMI, Free Fire):        points = placementPoints[placement-1] + kills * killPoints.
 *   A BR "win" is a 1st-place finish; every other finish counts as a loss for win-rate purposes.
 *
 * Cross-game ("overall") views use CIRCUIT points so battle-royale point totals don't
 * swamp head-to-head totals: 3 per win (BR: 1st place), 1 per draw or top-half BR finish.
 */
import { DEFAULT_SCORING, defaultScoringFor } from '../lib/constants.js';

export function rulesFor(tournament) {
  return tournament?.scoringRules ?? (tournament ? defaultScoringFor(tournament.game) : DEFAULT_SCORING.h2h);
}

/** Points + outcome for a single team result in a completed match. */
export function scoreResult(result, rules, matchResults = []) {
  if (rules.type === 'br') {
    const placement = Number(result.placement) || 0;
    const place = placement > 0 ? rules.placementPoints?.[placement - 1] ?? 0 : 0;
    const points = place + (Number(result.kills) || 0) * (rules.killPoints ?? 0);
    return { points, outcome: placement === 1 ? 'win' : 'loss' };
  }
  const hasWinner = matchResults.some((r) => r.isWinner);
  if (result.isWinner) return { points: rules.win ?? 3, outcome: 'win' };
  if (!hasWinner) return { points: rules.draw ?? 1, outcome: 'draw' };
  return { points: rules.loss ?? 0, outcome: 'loss' };
}

export const CIRCUIT_RULES = { win: 3, draw: 1, brTopHalf: 1, loss: 0 };

/** Normalised cross-game points for one result. */
export function scoreCircuit(result, rules, matchResults = []) {
  if (rules.type === 'br') {
    const placement = Number(result.placement) || 0;
    if (placement === 1) return { points: CIRCUIT_RULES.win, outcome: 'win' };
    const half = Math.ceil(matchResults.length / 2);
    return { points: placement > 0 && placement <= half ? CIRCUIT_RULES.brTopHalf : CIRCUIT_RULES.loss, outcome: 'loss' };
  }
  const { outcome } = scoreResult(result, rules, matchResults);
  return { points: CIRCUIT_RULES[outcome], outcome };
}

function emptyRow(teamId) {
  return { teamId, played: 0, wins: 0, losses: 0, draws: 0, points: 0, kills: 0, winRate: 0, form: [] };
}

export function compareRows(a, b) {
  return (
    b.points - a.points ||
    b.wins - a.wins ||
    b.winRate - a.winRate ||
    (b.kills ?? 0) - (a.kills ?? 0) ||
    String(a.name ?? a.teamId).localeCompare(String(b.name ?? b.teamId))
  );
}

export function groupBy(list, key) {
  const map = new Map();
  for (const item of list) {
    const k = typeof key === 'function' ? key(item) : item[key];
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(item);
  }
  return map;
}

/**
 * @param {object} db snapshot { tournaments, matches, results, teams }
 * @param {object} filter { game?, tournamentId?, before? (ISO — only matches scheduled strictly before) }
 *   With neither game nor tournamentId the standings are cross-game and use circuit points.
 */
export function computeStandings(db, filter = {}) {
  const circuit = !filter.game && !filter.tournamentId;
  const score = circuit ? scoreCircuit : scoreResult;
  const tById = new Map(db.tournaments.map((t) => [t.id, t]));
  const resultsByMatch = groupBy(db.results, 'matchId');
  const rows = new Map();

  const matches = db.matches
    .filter((m) => m.status === 'completed')
    .filter((m) => !filter.tournamentId || m.tournamentId === filter.tournamentId)
    .filter((m) => !filter.game || tById.get(m.tournamentId)?.game === filter.game)
    .filter((m) => !filter.before || new Date(m.scheduledAt) < new Date(filter.before))
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  for (const match of matches) {
    const tournament = tById.get(match.tournamentId);
    if (!tournament || tournament.status === 'cancelled') continue;
    const rules = rulesFor(tournament);
    const mResults = resultsByMatch.get(match.id) ?? [];
    for (const r of mResults) {
      const row = rows.get(r.teamId) ?? emptyRow(r.teamId);
      const { points, outcome } = score(r, rules, mResults);
      row.played += 1;
      row.points += points;
      row.kills += Number(r.kills) || 0;
      if (outcome === 'win') row.wins += 1;
      else if (outcome === 'draw') row.draws += 1;
      else row.losses += 1;
      row.form.push(outcome === 'win' ? 'W' : outcome === 'draw' ? 'D' : 'L');
      rows.set(r.teamId, row);
    }
  }

  const teamById = new Map((db.teams ?? []).map((t) => [t.id, t]));
  const list = [...rows.values()].map((row) => ({
    ...row,
    name: teamById.get(row.teamId)?.name ?? 'Unknown team',
    winRate: row.played ? row.wins / row.played : 0,
    form: row.form.slice(-5),
  }));
  list.sort(compareRows);
  list.forEach((row, i) => (row.rank = i + 1));
  return list;
}

/** Adds `movement` (+ means climbed) by comparing against standings before the latest match day. */
export function withMovement(db, filter = {}) {
  const current = computeStandings(db, filter);
  const completed = db.matches.filter((m) => m.status === 'completed').map((m) => new Date(m.scheduledAt).getTime());
  if (!completed.length) return current.map((r) => ({ ...r, movement: 0, isNew: false }));
  const cutoff = new Date(Math.max(...completed));
  cutoff.setUTCHours(0, 0, 0, 0);
  const previous = computeStandings(db, { ...filter, before: cutoff.toISOString() });
  const prevRank = new Map(previous.map((r) => [r.teamId, r.rank]));
  return current.map((r) => {
    const before = prevRank.get(r.teamId);
    return { ...r, movement: before ? before - r.rank : 0, isNew: !before && previous.length > 0 };
  });
}

/**
 * Individual rankings: a player is credited with their team's results
 * (team standings within the same filter) for every team they belong to.
 */
export function computePlayerStandings(db, filter = {}) {
  const teamRows = new Map(computeStandings(db, filter).map((r) => [r.teamId, r]));
  const byPlayer = new Map();
  for (const m of db.members) {
    const row = teamRows.get(m.teamId);
    if (!row) continue;
    const p = byPlayer.get(m.profileId) ?? { profileId: m.profileId, played: 0, wins: 0, losses: 0, draws: 0, points: 0, kills: 0, teamIds: [] };
    p.played += row.played;
    p.wins += row.wins;
    p.losses += row.losses;
    p.draws += row.draws;
    p.points += row.points;
    p.teamIds.push(m.teamId);
    byPlayer.set(m.profileId, p);
  }
  const profileById = new Map(db.profiles.map((p) => [p.id, p]));
  const list = [...byPlayer.values()]
    .filter((p) => profileById.has(p.profileId))
    .map((p) => ({ ...p, name: profileById.get(p.profileId).username, winRate: p.played ? p.wins / p.played : 0 }));
  list.sort(compareRows);
  list.forEach((r, i) => (r.rank = i + 1));
  return list;
}

/** Tournament champion = top of the tournament standings, only once completed. */
export function tournamentChampion(db, tournament) {
  if (tournament.status !== 'completed') return null;
  return computeStandings(db, { tournamentId: tournament.id })[0] ?? null;
}

export const CIRCUIT_DESCRIPTION = 'Overall rankings use circuit points so every game counts equally: 3 per win (battle royale: 1st place), 1 per draw or top-half lobby finish.';

/** Human-readable explanation of a scoring rule set. */
export function describeRules(rules) {
  if (rules.type === 'br') {
    const top = rules.placementPoints.slice(0, 4).join(' / ');
    return `Battle royale: placement points (${top}…) + ${rules.killPoints} pt per kill. A 1st-place finish counts as a win.`;
  }
  return `Head-to-head: win ${rules.win} pts · draw ${rules.draw} pts · loss ${rules.loss} pts.`;
}

/**
 * Cumulative points per team at the end of each match day (IST), for charts.
 * Returns [{ day: 'YYYY-MM-DD', [teamId]: points, ... }].
 */
export function pointsTimeline(db, filter, teamIds) {
  const tById = new Map(db.tournaments.map((t) => [t.id, t]));
  const days = [
    ...new Set(
      db.matches
        .filter((m) => m.status === 'completed')
        .filter((m) => !filter.tournamentId || m.tournamentId === filter.tournamentId)
        .filter((m) => !filter.game || tById.get(m.tournamentId)?.game === filter.game)
        .map((m) => istDay(m.scheduledAt))
    ),
  ].sort();
  return days.map((day) => {
    const end = new Date(new Date(`${day}T00:00:00+05:30`).getTime() + 86400000).toISOString();
    const rows = computeStandings(db, { ...filter, before: end });
    const point = { day };
    teamIds.forEach((id) => (point[id] = rows.find((r) => r.teamId === id)?.points ?? 0));
    return point;
  });
}

function istDay(iso) {
  return new Date(new Date(iso).getTime() + 5.5 * 3600000).toISOString().slice(0, 10);
}
