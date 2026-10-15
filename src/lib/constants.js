export const TIMEZONE = 'Asia/Kolkata';
export const TIMEZONE_LABEL = 'IST';

export const GAMES = {
  bgmi: {
    id: 'bgmi',
    name: 'BGMI',
    full: 'Battlegrounds Mobile India',
    genre: 'Battle Royale',
    color: '#F5A524',
    accent: '#FFD166',
    defaultFormat: 'squad',
  },
  valorant: {
    id: 'valorant',
    name: 'Valorant',
    full: 'Valorant',
    genre: 'Tactical Shooter',
    color: '#FF4655',
    accent: '#FF8A94',
    defaultFormat: '5v5',
  },
  freefire: {
    id: 'freefire',
    name: 'Free Fire',
    full: 'Free Fire MAX',
    genre: 'Battle Royale',
    color: '#FF7A1A',
    accent: '#FFB27A',
    defaultFormat: 'squad',
  },
  minimilitia: {
    id: 'minimilitia',
    name: 'Mini Militia',
    full: 'Mini Militia: Doodle Army 2',
    genre: '2D Arena Shooter',
    color: '#3DDC97',
    accent: '#9BF2C9',
    defaultFormat: 'duo',
  },
};
export const GAME_LIST = Object.values(GAMES);

export const FORMATS = {
  solo: { id: 'solo', label: 'Solo', teamSize: 1, maxSubs: 0 },
  duo: { id: 'duo', label: 'Duo', teamSize: 2, maxSubs: 1 },
  squad: { id: 'squad', label: 'Squad (4)', teamSize: 4, maxSubs: 1 },
  '5v5': { id: '5v5', label: '5v5', teamSize: 5, maxSubs: 2 },
};
export const FORMAT_LIST = Object.values(FORMATS);

/** Stored tournament lifecycle statuses (admin-controlled). */
export const TOURNAMENT_STATUS = {
  draft: 'Draft',
  open: 'Registration Open',
  upcoming: 'Upcoming',
  ongoing: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const MATCH_STATUS = {
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const REG_STATUS = {
  pending: 'Pending approval',
  approved: 'Approved',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const DEFAULT_SCORING = {
  h2h: { type: 'h2h', win: 3, draw: 1, loss: 0 },
  br: { type: 'br', killPoints: 1, placementPoints: [15, 12, 10, 8, 6, 4, 2, 1, 1, 1, 0, 0] },
};

export function defaultScoringFor(gameId) {
  return gameId === 'bgmi' || gameId === 'freefire' ? DEFAULT_SCORING.br : DEFAULT_SCORING.h2h;
}

export const TEAM_COLORS = ['#C6FF3D', '#8B5CF6', '#22D3EE', '#FF4655', '#F5A524', '#3DDC97', '#FF7A1A', '#E879F9', '#60A5FA', '#FACC15'];
