const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME = /^[a-zA-Z0-9_.]{3,20}$/;
const TAG = /^[A-Z0-9]{2,5}$/;

export function validateEmail(email) {
  if (!email?.trim()) return 'Email is required.';
  if (!EMAIL.test(email.trim())) return 'Enter a valid email address.';
  return null;
}

export function validatePassword(pw) {
  if (!pw) return 'Password is required.';
  if (pw.length < 8) return 'Use at least 8 characters.';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Include at least one letter and one number.';
  return null;
}

export function validateUsername(name) {
  if (!name?.trim()) return 'Username is required.';
  if (!USERNAME.test(name.trim())) return '3–20 characters: letters, numbers, _ or .';
  return null;
}

export function validateSignup({ email, password, confirm, username, displayName, college }, { requirePassword = true } = {}) {
  const e = {};
  const em = validateEmail(email);
  if (em) e.email = em;
  if (requirePassword) {
    const pw = validatePassword(password);
    if (pw) e.password = pw;
    if (confirm !== password) e.confirm = 'Passwords do not match.';
  }
  const un = validateUsername(username);
  if (un) e.username = un;
  if (!displayName?.trim()) e.displayName = 'Display name is required.';
  if (!college?.trim()) e.college = 'College name is required.';
  return e;
}

export function validateProfile({ displayName, username, college }, existing = [], selfId = null) {
  const e = {};
  if (!displayName?.trim()) e.displayName = 'Display name is required.';
  else if (displayName.trim().length > 40) e.displayName = 'Keep it under 40 characters.';
  const un = validateUsername(username);
  if (un) e.username = un;
  else if (existing.some((p) => p.id !== selfId && p.username.toLowerCase() === username.trim().toLowerCase())) {
    e.username = 'That username is taken.';
  }
  if (!college?.trim()) e.college = 'College name is required.';
  return e;
}

export function validateTeam({ name, tag, game }, existingTeams = [], selfId = null) {
  const e = {};
  const n = name?.trim() ?? '';
  if (!n) e.name = 'Team name is required.';
  else if (n.length < 3 || n.length > 24) e.name = 'Team name must be 3–24 characters.';
  else if (existingTeams.some((t) => t.id !== selfId && t.game === game && t.name.toLowerCase() === n.toLowerCase())) {
    e.name = 'A team with this name already exists for this game.';
  }
  if (!TAG.test(tag ?? '')) e.tag = 'Tag must be 2–5 uppercase letters or numbers.';
  if (!game) e.game = 'Select a game.';
  return e;
}

export function validateTournament(t) {
  const e = {};
  if (!t.name?.trim() || t.name.trim().length < 4) e.name = 'Name must be at least 4 characters.';
  if (!t.game) e.game = 'Select a game.';
  if (!t.format) e.format = 'Select a format.';
  const max = Number(t.maxTeams);
  if (!Number.isInteger(max) || max < 2) e.maxTeams = 'At least 2 teams.';
  else if (max > 256) e.maxTeams = 'Maximum 256 teams.';
  if (!(Number(t.entryFee) >= 0)) e.entryFee = 'Enter 0 or more.';
  if (!(Number(t.prizePool) >= 0)) e.prizePool = 'Enter 0 or more.';
  if (!t.regDeadline) e.regDeadline = 'Set a registration deadline.';
  if (!t.startAt) e.startAt = 'Set a start date.';
  if (t.regDeadline && t.startAt && new Date(t.regDeadline) > new Date(t.startAt)) {
    e.regDeadline = 'Deadline must be before the start date.';
  }
  return e;
}

export function validateInviteCode(code) {
  if (!code?.trim()) return 'Enter an invite code.';
  if (!/^[A-Z0-9]{6,10}$/.test(code.trim().toUpperCase())) return 'Invite codes are 6–10 letters or numbers.';
  return null;
}

export const hasErrors = (e) => Object.keys(e).length > 0;
