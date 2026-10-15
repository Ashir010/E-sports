/**
 * DEMO DATA — fictional teams, players and tournaments for presenting the app
 * before Supabase is connected. Dates are generated relative to "now" so that
 * open/upcoming tournaments stay current. Generation is deterministic.
 */
import { DEFAULT_SCORING, TEAM_COLORS } from '../../lib/constants.js';
import { DEMO_TEAMS, HANDLES, FIRST_NAMES, LAST_NAMES, DEMO_USERS } from './fixtures.js';

const DAY = 86400000;

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Start of "today" in IST, as a UTC timestamp. */
function istMidnight(now) {
  const ist = new Date(now + 5.5 * 3600000);
  ist.setUTCHours(0, 0, 0, 0);
  return ist.getTime() - 5.5 * 3600000;
}

export function generateDemoData(now = Date.now()) {
  const rand = mulberry32(2026);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const base = istMidnight(now);
  /** ISO for `day` days from today at `hour`:`min` IST. */
  const at = (day, hour = 18, min = 0) => new Date(base + day * DAY + (hour * 60 + min) * 60000).toISOString();
  const created = (day) => at(day, 11);

  // ---------- profiles ----------
  const profiles = DEMO_USERS.map((u) => ({ ...u, createdAt: created(-120) }));
  let handleIdx = 0;
  const makePlayer = (game, college) => {
    const first = FIRST_NAMES[handleIdx % FIRST_NAMES.length];
    const last = LAST_NAMES[(handleIdx * 7) % LAST_NAMES.length];
    const handle = HANDLES[handleIdx % HANDLES.length] + (handleIdx >= HANDLES.length ? handleIdx : '');
    handleIdx += 1;
    const id = `p-${handle.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const p = {
      id,
      username: handle,
      displayName: `${first} ${last}`,
      avatarColor: TEAM_COLORS[handleIdx % TEAM_COLORS.length],
      avatarUrl: null,
      college,
      favoriteGame: game,
      gameIds: { [game]: gameIdFor(game, handle, rand) },
      role: 'player',
      bio: '',
      createdAt: created(-100 + handleIdx),
    };
    profiles.push(p);
    return p;
  };

  // ---------- teams + members ----------
  const teams = [];
  const members = [];
  DEMO_TEAMS.forEach((t, i) => {
    const size = { valorant: 5, bgmi: 4, freefire: 4, minimilitia: 2 }[t.game];
    const roster = [];
    if (t.fixedCaptain) roster.push(profiles.find((p) => p.id === t.fixedCaptain));
    else roster.push(makePlayer(t.game, t.college));
    for (const uid of t.fixedMembers ?? []) roster.push(profiles.find((p) => p.id === uid));
    while (roster.length < size) roster.push(makePlayer(t.game, t.college));
    const captain = roster[0];
    teams.push({
      id: t.id,
      name: t.name,
      tag: t.tag,
      game: t.game,
      color: t.color ?? TEAM_COLORS[i % TEAM_COLORS.length],
      logoUrl: null,
      captainId: captain.id,
      inviteCode: t.inviteCode,
      college: t.college,
      createdAt: created(-90 + i),
    });
    roster.forEach((p, idx) => {
      if (!p.gameIds[t.game]) p.gameIds[t.game] = gameIdFor(t.game, p.username, rand);
      members.push({
        id: `m-${t.id}-${p.id}`,
        teamId: t.id,
        profileId: p.id,
        inGameId: p.gameIds[t.game],
        role: idx === 0 ? 'captain' : 'player',
        joinedAt: created(-88 + i),
      });
    });
  });
  const ids = (game) => teams.filter((t) => t.game === game).map((t) => t.id);
  const VAL = ids('valorant');
  const BGMI = ids('bgmi');
  const FF = ids('freefire');
  const MM = ids('minimilitia');

  // ---------- tournaments ----------
  const prize = (total, split) => split.map(([place, pct]) => ({ place, amount: Math.round((total * pct) / 100) }));
  const stdRules = (game) => [
    'All players must be currently enrolled students and carry a valid college ID.',
    'Teams must check in on Discord 30 minutes before their first match.',
    'Emulators, third-party tools, and scripts are strictly prohibited.',
    game === 'valorant' ? 'Matches are Best-of-1 in groups and Best-of-3 in playoffs. Map veto via captain draft.' : 'Lobby passwords are shared with captains 15 minutes before each match.',
    'Disputes must be raised by the captain within 15 minutes of the match ending, with screenshots.',
    'Toxic behaviour, cheating, or account sharing results in disqualification.',
  ];
  const T = (o) => ({
    description: '',
    requiresApproval: false,
    mode: 'Online',
    rules: stdRules(o.game),
    requirements: ['Valid college ID', 'Verified in-game ID for every player', 'Discord account for match coordination'],
    createdAt: created(-60),
    ...o,
    teamSize: { solo: 1, duo: 2, squad: 4, '5v5': 5 }[o.format],
    scoringRules: o.scoringRules ?? (o.game === 'bgmi' || o.game === 'freefire' ? DEFAULT_SCORING.br : DEFAULT_SCORING.h2h),
  });

  const tournaments = [
    T({
      id: 't-val-clash',
      name: 'Valorant Campus Clash S3',
      game: 'valorant',
      format: '5v5',
      maxTeams: 8,
      entryFee: 500,
      prizePool: 50000,
      prizeDistribution: prize(50000, [['1st', 50], ['2nd', 25], ['3rd–4th', 12.5]]),
      regDeadline: at(6, 23, 59),
      startAt: at(10, 17),
      endAt: at(12, 22),
      status: 'open',
      featured: true,
      requiresApproval: true,
      description: 'Eight of the sharpest college rosters battle across a double-header weekend. Group stage Bo1, playoffs Bo3, grand final on LAN-style broadcast.',
    }),
    T({
      id: 't-bgmi-showdown',
      name: 'BGMI Erangel Showdown',
      game: 'bgmi',
      format: 'squad',
      maxTeams: 16,
      entryFee: 200,
      prizePool: 30000,
      prizeDistribution: prize(30000, [['1st', 50], ['2nd', 30], ['3rd', 20]]),
      regDeadline: at(4, 23, 59),
      startAt: at(8, 16),
      endAt: at(9, 21),
      status: 'open',
      featured: true,
      description: 'Six lobbies across Erangel and Miramar. Placement plus finishes decide the champion squad.',
    }),
    T({
      id: 't-ff-booyah',
      name: 'Free Fire Booyah Cup',
      game: 'freefire',
      format: 'squad',
      maxTeams: 4,
      entryFee: 100,
      prizePool: 15000,
      prizeDistribution: prize(15000, [['1st', 60], ['2nd', 25], ['3rd', 15]]),
      regDeadline: at(3, 23, 59),
      startAt: at(7, 19),
      endAt: at(7, 22),
      status: 'open',
      featured: true,
      description: 'A rapid-fire evening of Bermuda lobbies. Limited slots — first come, first served.',
    }),
    T({
      id: 't-mm-duel',
      name: 'Mini Militia Doodle Duel',
      game: 'minimilitia',
      format: 'duo',
      maxTeams: 8,
      entryFee: 0,
      prizePool: 5000,
      prizeDistribution: prize(5000, [['1st', 60], ['2nd', 40]]),
      regDeadline: at(-2, 23, 59),
      startAt: at(2, 18),
      endAt: at(3, 21),
      status: 'upcoming',
      featured: true,
      description: 'Free-entry duo deathmatch. First to 30 kills on Outpost and Catacombs.',
    }),
    T({
      id: 't-val-premier',
      name: 'Inter-College Valorant Premier',
      game: 'valorant',
      format: '5v5',
      maxTeams: 6,
      entryFee: 400,
      prizePool: 75000,
      prizeDistribution: prize(75000, [['1st', 50], ['2nd', 30], ['3rd', 20]]),
      regDeadline: at(-12, 23, 59),
      startAt: at(-5, 18),
      endAt: at(4, 22),
      status: 'ongoing',
      featured: true,
      description: 'Round-robin league among six invited campuses. Top two meet in the grand final.',
    }),
    T({
      id: 't-bgmi-series',
      name: 'BGMI Campus Series',
      game: 'bgmi',
      format: 'squad',
      maxTeams: 12,
      entryFee: 150,
      prizePool: 25000,
      prizeDistribution: prize(25000, [['1st', 50], ['2nd', 30], ['3rd', 20]]),
      regDeadline: at(-8, 23, 59),
      startAt: at(-1, 17),
      endAt: at(1, 21),
      status: 'ongoing',
      description: 'Two match days, four lobbies. Consistency wins.',
    }),
    T({
      id: 't-bgmi-monsoon',
      name: 'BGMI Monsoon Masters',
      game: 'bgmi',
      format: 'squad',
      maxTeams: 12,
      entryFee: 200,
      prizePool: 40000,
      prizeDistribution: prize(40000, [['1st', 50], ['2nd', 30], ['3rd', 20]]),
      regDeadline: at(-45, 23, 59),
      startAt: at(-40, 16),
      endAt: at(-39, 21),
      status: 'completed',
      description: 'The monsoon season flagship. Four lobbies, one champion.',
    }),
    T({
      id: 't-val-freshers',
      name: 'Valorant Freshers Cup',
      game: 'valorant',
      format: '5v5',
      maxTeams: 4,
      entryFee: 0,
      prizePool: 20000,
      prizeDistribution: prize(20000, [['1st', 60], ['2nd', 40]]),
      regDeadline: at(-33, 23, 59),
      startAt: at(-30, 17),
      endAt: at(-29, 22),
      status: 'completed',
      description: 'Single elimination for first-year heavy rosters.',
    }),
    T({
      id: 't-ff-league',
      name: 'Free Fire Clash League',
      game: 'freefire',
      format: 'squad',
      maxTeams: 8,
      entryFee: 100,
      prizePool: 12000,
      prizeDistribution: prize(12000, [['1st', 50], ['2nd', 30], ['3rd', 20]]),
      regDeadline: at(-23, 23, 59),
      startAt: at(-20, 18),
      endAt: at(-20, 22),
      status: 'completed',
      description: 'Three-lobby league night on Bermuda and Purgatory.',
    }),
    T({
      id: 't-mm-rumble',
      name: 'Mini Militia Rapid Rumble',
      game: 'minimilitia',
      format: 'duo',
      maxTeams: 4,
      entryFee: 0,
      prizePool: 3000,
      prizeDistribution: prize(3000, [['1st', 100]]),
      regDeadline: at(-17, 23, 59),
      startAt: at(-15, 18),
      endAt: at(-15, 21),
      status: 'completed',
      description: 'Round robin, every duo plays every duo.',
    }),
    T({
      id: 't-ff-nightops',
      name: 'Free Fire Night Ops',
      game: 'freefire',
      format: 'squad',
      maxTeams: 12,
      entryFee: 100,
      prizePool: 10000,
      prizeDistribution: prize(10000, [['1st', 60], ['2nd', 40]]),
      regDeadline: at(-10, 23, 59),
      startAt: at(-6, 21),
      endAt: at(-6, 23),
      status: 'cancelled',
      description: 'Cancelled due to a campus network outage. Entry fees were refunded.',
    }),
    T({
      id: 't-bgmi-winter',
      name: 'BGMI Winter Warzone',
      game: 'bgmi',
      format: 'squad',
      maxTeams: 24,
      entryFee: 250,
      prizePool: 60000,
      prizeDistribution: prize(60000, [['1st', 50], ['2nd', 30], ['3rd', 20]]),
      regDeadline: at(35, 23, 59),
      startAt: at(42, 16),
      endAt: at(43, 21),
      status: 'draft',
      description: 'Draft — not yet published.',
    }),
  ];

  // ---------- registrations ----------
  const registrations = [];
  const reg = (tournamentId, teamIds, status = 'approved', day = -20) =>
    teamIds.forEach((teamId, i) =>
      registrations.push({ id: `r-${tournamentId}-${teamId}`, tournamentId, teamId, status, createdAt: created(day + i * 0.2), updatedAt: created(day + i * 0.2) })
    );
  // Phantom Protocol (demo captain) intentionally NOT registered for Campus Clash.
  reg('t-val-clash', [VAL[2], VAL[3], VAL[4]], 'approved', -4);
  reg('t-val-clash', [VAL[5], VAL[1]], 'pending', -1);
  reg('t-bgmi-showdown', BGMI.slice(0, 5), 'approved', -3);
  reg('t-ff-booyah', FF, 'approved', -2);
  reg('t-mm-duel', MM, 'approved', -6);
  reg('t-val-premier', VAL, 'approved', -14);
  reg('t-bgmi-series', BGMI, 'approved', -10);
  reg('t-bgmi-monsoon', BGMI, 'approved', -48);
  reg('t-val-freshers', VAL.slice(0, 4), 'approved', -35);
  reg('t-ff-league', FF, 'approved', -25);
  reg('t-mm-rumble', MM, 'approved', -18);
  reg('t-ff-nightops', FF.slice(0, 3), 'withdrawn', -11);

  // ---------- matches + results ----------
  const matches = [];
  const results = [];
  let mIdx = 0;
  const h2h = (tournamentId, round, a, b, when, status, score, map) => {
    const id = `mt-${++mIdx}`;
    matches.push({ id, tournamentId, round, participants: [a, b], scheduledAt: when, status, map });
    if (status === 'completed' && score) {
      const [sa, sb] = score;
      results.push({ id: `res-${id}-a`, matchId: id, teamId: a, score: sa, placement: null, kills: null, isWinner: sa > sb });
      results.push({ id: `res-${id}-b`, matchId: id, teamId: b, score: sb, placement: null, kills: null, isWinner: sb > sa });
    }
    return id;
  };
  const lobby = (tournamentId, round, teamIds, when, status, map, order) => {
    const id = `mt-${++mIdx}`;
    matches.push({ id, tournamentId, round, participants: teamIds, scheduledAt: when, status, map });
    if (status === 'completed') {
      order.forEach((teamId, i) => {
        const kills = Math.max(0, Math.round((teamIds.length - i) * 2.2 + rand() * 6 - 1));
        results.push({ id: `res-${id}-${teamId}`, matchId: id, teamId, score: null, placement: i + 1, kills, isWinner: i === 0 });
      });
    }
    return id;
  };
  const VMAPS = ['Ascent', 'Bind', 'Haven', 'Lotus', 'Sunset', 'Split', 'Icebox'];

  // Valorant Freshers Cup (completed, single elim)
  h2h('t-val-freshers', 'Semifinal', VAL[0], VAL[2], at(-30, 17), 'completed', [13, 9], 'Ascent');
  h2h('t-val-freshers', 'Semifinal', VAL[1], VAL[3], at(-30, 19, 30), 'completed', [11, 13], 'Haven');
  h2h('t-val-freshers', 'Grand Final', VAL[0], VAL[3], at(-29, 19), 'completed', [13, 11], 'Bind');

  // BGMI Monsoon Masters (completed)
  const shuffle = (arr) => [...arr].sort(() => rand() - 0.5);
  const monsoonOrders = [
    [BGMI[4], BGMI[0], BGMI[2], BGMI[1], BGMI[5], BGMI[3]],
    [BGMI[0], BGMI[4], BGMI[1], BGMI[3], BGMI[2], BGMI[5]],
    [BGMI[4], BGMI[2], BGMI[0], BGMI[5], BGMI[1], BGMI[3]],
    [BGMI[1], BGMI[4], BGMI[0], BGMI[2], BGMI[3], BGMI[5]],
  ];
  ['Erangel', 'Miramar', 'Erangel', 'Sanhok'].forEach((map, i) =>
    lobby('t-bgmi-monsoon', `Lobby ${i + 1}`, BGMI, at(-40 + Math.floor(i / 2), i % 2 ? 19 : 16), 'completed', map, monsoonOrders[i])
  );

  // Free Fire Clash League (completed)
  [[FF[1], FF[0], FF[3], FF[2]], [FF[0], FF[1], FF[2], FF[3]], [FF[1], FF[2], FF[0], FF[3]]].forEach((order, i) =>
    lobby('t-ff-league', `Lobby ${i + 1}`, FF, at(-20, 18 + i), 'completed', i === 1 ? 'Purgatory' : 'Bermuda', order)
  );

  // Mini Militia Rapid Rumble (completed, round robin)
  const mmScores = [[30, 24], [30, 27], [21, 30], [30, 18], [28, 30], [30, 26]];
  let k = 0;
  for (let i = 0; i < MM.length; i++)
    for (let j = i + 1; j < MM.length; j++) {
      h2h('t-mm-rumble', 'Round Robin', MM[i], MM[j], at(-15, 18, k * 25), 'completed', mmScores[k], k % 2 ? 'Catacombs' : 'Outpost');
      k++;
    }

  // Inter-College Valorant Premier (ongoing round robin)
  const premier = [
    [0, 1, -5, [13, 10]], [2, 3, -5, [13, 7]], [4, 5, -4, [9, 13]],
    [0, 2, -4, [13, 11]], [1, 4, -3, [13, 8]], [3, 5, -3, [6, 13]],
    [0, 3, -2, [13, 5]], [1, 5, -2, [12, 14]], [2, 4, -1, [13, 9]],
  ];
  premier.forEach(([a, b, d, s], i) => h2h('t-val-premier', `Week ${Math.ceil((i + 1) / 3)}`, VAL[a], VAL[b], at(d, i % 3 === 0 ? 17 : i % 3 === 1 ? 19 : 21), 'completed', s, VMAPS[i % VMAPS.length]));
  // in progress right now — no score shown until an admin enters the result
  h2h('t-val-premier', 'Week 4', VAL[0], VAL[5], new Date(now - 40 * 60000).toISOString(), 'in_progress', null, 'Lotus');
  h2h('t-val-premier', 'Week 4', VAL[1], VAL[2], at(1, 19), 'scheduled', null, 'Sunset');
  h2h('t-val-premier', 'Week 4', VAL[3], VAL[4], at(1, 21), 'scheduled', null, 'Split');
  h2h('t-val-premier', 'Week 5', VAL[0], VAL[4], at(2, 19), 'scheduled', null, 'Haven');
  h2h('t-val-premier', 'Grand Final', null, null, at(4, 19), 'scheduled', null, 'TBD');

  // BGMI Campus Series (ongoing)
  lobby('t-bgmi-series', 'Day 1 · Lobby 1', BGMI, at(-1, 17), 'completed', 'Erangel', shuffle(BGMI));
  lobby('t-bgmi-series', 'Day 1 · Lobby 2', BGMI, at(-1, 19), 'completed', 'Miramar', shuffle(BGMI));
  lobby('t-bgmi-series', 'Day 2 · Lobby 3', BGMI, at(1, 17), 'scheduled', 'Erangel');
  lobby('t-bgmi-series', 'Day 2 · Lobby 4', BGMI, at(1, 19), 'scheduled', 'Sanhok');

  // Mini Militia Doodle Duel (upcoming)
  h2h('t-mm-duel', 'Quarterfinal', MM[0], MM[3], at(2, 18), 'scheduled', null, 'Outpost');
  h2h('t-mm-duel', 'Quarterfinal', MM[1], MM[2], at(2, 18, 40), 'scheduled', null, 'Catacombs');

  // Remove placeholder participants (TBD final)
  matches.forEach((m) => (m.participants = m.participants.filter(Boolean)));

  // ---------- activity ----------
  const activity = [
    { id: 'a1', type: 'registration', message: 'Kinetic Ascent requested a slot in Valorant Campus Clash S3', createdAt: at(-1, 14) },
    { id: 'a2', type: 'result', message: 'Result posted: Spike Syndicate 13–9 Echo Five', createdAt: at(-1, 22, 10) },
    { id: 'a3', type: 'result', message: 'BGMI Campus Series Day 1 results published', createdAt: at(-1, 21) },
    { id: 'a4', type: 'registration', message: 'Booyah Cup is now full (4/4 teams)', createdAt: at(-2, 16) },
    { id: 'a5', type: 'tournament', message: 'Free Fire Night Ops was cancelled', createdAt: at(-7, 12) },
  ];

  return {
    version: 1,
    seededAt: new Date(now).toISOString(),
    profiles,
    teams,
    members,
    tournaments,
    registrations,
    matches,
    results,
    activity,
  };
}

function gameIdFor(game, handle, rand) {
  const digits = (n) => Array.from({ length: n }, () => Math.floor(rand() * 10)).join('');
  if (game === 'valorant') return `${handle}#${digits(4)}`;
  if (game === 'bgmi') return `5${digits(9)}`;
  if (game === 'freefire') return `${digits(10)}`;
  return handle;
}
