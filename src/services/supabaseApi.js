/**
 * Supabase implementation of the data API. All permission and integrity rules are
 * enforced in Postgres (RLS policies + SECURITY DEFINER functions in /supabase/migrations).
 * The browser only ever holds the public anon key.
 */
import { supabase } from '../lib/supabase.js';
import { FORMATS } from '../lib/constants.js';
import { validateTournament, hasErrors } from '../utils/validation.js';

class ApiError extends Error {}

function check({ data, error }) {
  if (error) throw new ApiError(friendly(error));
  return data;
}

function friendly(error) {
  const msg = error.message || 'Something went wrong.';
  if (error.code === '23505') return 'That already exists (duplicate).';
  if (error.code === '42501' || /row-level security/i.test(msg)) return 'You do not have permission to do that.';
  return msg;
}

// ---------- row mappers (snake_case → camelCase) ----------
const mapProfile = (r) => ({
  id: r.id,
  username: r.username,
  displayName: r.display_name,
  avatarUrl: r.avatar_url,
  avatarColor: r.avatar_color,
  college: r.college,
  favoriteGame: r.favorite_game,
  gameIds: r.game_ids ?? {},
  role: r.role,
  bio: r.bio ?? '',
  createdAt: r.created_at,
});
const mapTournament = (r) => ({
  id: r.id,
  name: r.name,
  description: r.description ?? '',
  game: r.game,
  format: r.format,
  teamSize: r.team_size,
  maxTeams: r.max_teams,
  entryFee: Number(r.entry_fee),
  prizePool: Number(r.prize_pool),
  prizeDistribution: r.prize_distribution ?? [],
  scoringRules: r.scoring_rules,
  rules: r.rules ?? [],
  requirements: r.requirements ?? [],
  regDeadline: r.reg_deadline,
  startAt: r.start_at,
  endAt: r.end_at,
  status: r.status,
  requiresApproval: r.requires_approval,
  featured: r.featured,
  mode: r.mode,
  createdAt: r.created_at,
});
const mapTeam = (r) => ({
  id: r.id,
  name: r.name,
  tag: r.tag,
  game: r.game,
  color: r.color,
  logoUrl: r.logo_url,
  captainId: r.captain_id,
  college: r.college,
  createdAt: r.created_at,
  inviteCode: null,
});
const mapMember = (r) => ({ id: r.id, teamId: r.team_id, profileId: r.profile_id, inGameId: r.in_game_id, role: r.role, joinedAt: r.joined_at });
const mapReg = (r) => ({ id: r.id, tournamentId: r.tournament_id, teamId: r.team_id, status: r.status, createdAt: r.created_at, updatedAt: r.updated_at });
const mapResult = (r) => ({ id: r.id, matchId: r.match_id, teamId: r.team_id, score: r.score, placement: r.placement, kills: r.kills, isWinner: r.is_winner });

export const supabaseApi = {
  mode: 'supabase',

  async loadSnapshot() {
    const q = (table) => supabase.from(table).select('*');
    const [profiles, tournaments, teams, invites, members, registrations, matches, participants, results, activity] = await Promise.all([
      q('profiles'),
      q('tournaments'),
      q('teams'),
      q('team_invites'),
      q('team_members'),
      q('tournament_registrations'),
      q('matches'),
      q('match_participants'),
      q('match_results'),
      supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(30),
    ]).then((rs) => rs.map(check));

    const codeByTeam = new Map(invites.map((i) => [i.team_id, i.code]));
    const partsByMatch = new Map();
    participants.forEach((p) => {
      if (!partsByMatch.has(p.match_id)) partsByMatch.set(p.match_id, []);
      partsByMatch.get(p.match_id).push(p.team_id);
    });

    return {
      profiles: profiles.map(mapProfile),
      tournaments: tournaments.map(mapTournament),
      teams: teams.map((t) => ({ ...mapTeam(t), inviteCode: codeByTeam.get(t.id) ?? null })),
      members: members.map(mapMember),
      registrations: registrations.map(mapReg),
      matches: matches.map((m) => ({
        id: m.id,
        tournamentId: m.tournament_id,
        round: m.round,
        scheduledAt: m.scheduled_at,
        status: m.status,
        map: m.map ?? '',
        participants: partsByMatch.get(m.id) ?? [],
      })),
      results: results.map(mapResult),
      activity: activity.map((a) => ({ id: a.id, type: a.type, message: a.message, createdAt: a.created_at })),
    };
  },

  // ---------------- auth ----------------
  async getSessionUserId() {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id ?? null;
  },
  onAuthChange(cb) {
    const { data } = supabase.auth.onAuthStateChange((event, session) => cb(event, session?.user?.id ?? null));
    return () => data.subscription.unsubscribe();
  },
  async signUp({ email, password, username, displayName, college, favoriteGame }) {
    const taken = check(await supabase.from('profiles').select('id').ilike('username', username).limit(1));
    if (taken.length) throw new ApiError('That username is taken.');
    const data = check(
      await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: { username, display_name: displayName, college, favorite_game: favoriteGame },
        },
      })
    );
    return { userId: data.user?.id ?? null, needsConfirmation: !data.session };
  },
  async signIn({ email, password }) {
    const data = check(await supabase.auth.signInWithPassword({ email, password }));
    return data.user.id;
  },
  async signOut() {
    check(await supabase.auth.signOut());
  },
  async resetPassword(email) {
    check(await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` }));
  },
  async updatePassword(password) {
    check(await supabase.auth.updateUser({ password }));
  },

  // ---------------- profiles ----------------
  async updateProfile(userId, patch) {
    const row = {
      display_name: patch.displayName?.trim(),
      username: patch.username?.trim(),
      college: patch.college?.trim(),
      favorite_game: patch.favoriteGame,
      game_ids: patch.gameIds,
      bio: patch.bio,
      avatar_url: patch.avatarUrl,
      avatar_color: patch.avatarColor,
    };
    Object.keys(row).forEach((k) => row[k] === undefined && delete row[k]);
    check(await supabase.from('profiles').update(row).eq('id', userId));
  },
  async setRole(_adminId, profileId, role) {
    check(await supabase.rpc('admin_set_role', { p_profile_id: profileId, p_role: role }));
  },
  async uploadImage(file, userId) {
    if (!file.type.startsWith('image/')) throw new ApiError('Please choose an image file.');
    if (file.size > 2 * 1024 * 1024) throw new ApiError('Image must be under 2 MB.');
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const path = `${userId}/${Date.now()}.${ext}`;
    check(await supabase.storage.from('media').upload(path, file, { upsert: false, contentType: file.type }));
    return supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
  },

  // ---------------- teams ----------------
  async createTeam(_userId, { name, tag, game, color, logoUrl, college, inGameId }) {
    const id = check(
      await supabase.rpc('create_team', {
        p_name: name.trim(),
        p_tag: tag,
        p_game: game,
        p_color: color,
        p_logo_url: logoUrl || null,
        p_college: college,
        p_in_game_id: inGameId.trim(),
      })
    );
    return { id };
  },
  async updateTeam(_userId, teamId, patch) {
    check(
      await supabase
        .from('teams')
        .update({ name: patch.name?.trim(), tag: patch.tag, color: patch.color, logo_url: patch.logoUrl ?? null, college: patch.college })
        .eq('id', teamId)
    );
  },
  async joinTeam(_userId, code, inGameId) {
    const id = check(await supabase.rpc('join_team_by_code', { p_code: code.trim().toUpperCase(), p_in_game_id: inGameId.trim() }));
    return { id };
  },
  async leaveTeam(_userId, teamId) {
    check(await supabase.rpc('leave_team', { p_team_id: teamId }));
  },
  async removeMember(_userId, teamId, profileId) {
    check(await supabase.rpc('remove_team_member', { p_team_id: teamId, p_profile_id: profileId }));
  },
  async transferCaptain(_userId, teamId, profileId) {
    check(await supabase.rpc('transfer_captain', { p_team_id: teamId, p_profile_id: profileId }));
  },
  async regenerateInvite(_userId, teamId) {
    return check(await supabase.rpc('regenerate_invite_code', { p_team_id: teamId }));
  },
  async deleteTeam(_userId, teamId) {
    check(await supabase.rpc('delete_team', { p_team_id: teamId }));
  },

  // ---------------- registrations ----------------
  async registerTeam(_userId, tournamentId, teamId) {
    return check(await supabase.rpc('register_team', { p_tournament_id: tournamentId, p_team_id: teamId }));
  },
  async withdrawRegistration(_userId, registrationId) {
    check(await supabase.rpc('withdraw_registration', { p_registration_id: registrationId }));
  },
  async setRegistrationStatus(_adminId, registrationId, status) {
    check(await supabase.rpc('admin_set_registration_status', { p_registration_id: registrationId, p_status: status }));
  },

  // ---------------- tournaments ----------------
  async saveTournament(_adminId, data) {
    const errors = validateTournament(data);
    if (hasErrors(errors)) throw new ApiError(Object.values(errors)[0]);
    const row = {
      name: data.name.trim(),
      description: data.description,
      game: data.game,
      format: data.format,
      team_size: FORMATS[data.format].teamSize,
      max_teams: Number(data.maxTeams),
      entry_fee: Number(data.entryFee),
      prize_pool: Number(data.prizePool),
      prize_distribution: data.prizeDistribution,
      scoring_rules: data.scoringRules,
      rules: data.rules,
      requirements: data.requirements,
      reg_deadline: data.regDeadline,
      start_at: data.startAt,
      end_at: data.endAt || null,
      status: data.status,
      requires_approval: !!data.requiresApproval,
      featured: !!data.featured,
      mode: data.mode || 'Online',
    };
    if (data.id) check(await supabase.from('tournaments').update(row).eq('id', data.id));
    else check(await supabase.from('tournaments').insert(row));
  },
  async setTournamentStatus(_adminId, tournamentId, status) {
    check(await supabase.from('tournaments').update({ status }).eq('id', tournamentId));
  },

  // ---------------- matches ----------------
  async saveMatch(_adminId, data) {
    return check(
      await supabase.rpc('admin_save_match', {
        p_id: data.id ?? null,
        p_tournament_id: data.tournamentId,
        p_round: data.round,
        p_scheduled_at: data.scheduledAt,
        p_status: data.status ?? 'scheduled',
        p_map: data.map ?? '',
        p_participants: data.participants ?? [],
      })
    );
  },
  async deleteMatch(_adminId, matchId) {
    check(await supabase.from('matches').delete().eq('id', matchId));
  },
  async saveResults(_adminId, matchId, results) {
    check(
      await supabase.rpc('admin_save_results', {
        p_match_id: matchId,
        p_results: results.map((r) => ({ team_id: r.teamId, score: r.score ?? null, placement: r.placement ?? null, kills: r.kills ?? null, is_winner: !!r.isWinner })),
      })
    );
  },
};
