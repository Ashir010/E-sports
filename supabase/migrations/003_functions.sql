-- =====================================================================
-- Esports Tournament Hub — 003 business-rule functions
-- Each function runs as the table owner (SECURITY DEFINER) but checks
-- auth.uid() / is_admin() itself, so it is the ONLY write path for its data.
-- =====================================================================

-- ---------- helpers ----------
create or replace function public.format_roster_limits(p_format text, out min_players int, out max_players int)
language sql immutable as $$
  -- Mirrors FORMATS in src/lib/constants.js: required players + allowed substitutes.
  select case p_format when 'solo' then 1 when 'duo' then 2 when 'squad' then 4 when '5v5' then 5 end,
         case p_format when 'solo' then 1 when 'duo' then 3 when 'squad' then 5 when '5v5' then 7 end;
$$;

create or replace function public.game_default_format(p_game text)
returns text language sql immutable as $$
  select case p_game when 'valorant' then '5v5' when 'minimilitia' then 'duo' else 'squad' end;
$$;

create or replace function public.log_activity(p_type text, p_message text)
returns void language sql security definer set search_path = public as $$
  insert into public.activity_log (type, message, actor_id) values (p_type, p_message, auth.uid());
$$;
revoke execute on function public.log_activity(text, text) from public, anon, authenticated;

create or replace function public.new_invite_code()
returns text language plpgsql as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v text;
begin
  loop
    v := '';
    for i in 1..8 loop
      v := v || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;
    exit when not exists (select 1 from public.team_invites where code = v);
  end loop;
  return v;
end $$;

-- Roster is locked while the team holds an active registration in a tournament that has closed registration.
create or replace function public.team_roster_locked(p_team_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.tournament_registrations r
    join public.tournaments t on t.id = r.tournament_id
    where r.team_id = p_team_id and r.status in ('pending','approved') and t.status in ('upcoming','ongoing')
  );
$$;

-- ---------- teams ----------
create or replace function public.create_team(
  p_name text, p_tag text, p_game text, p_color text, p_logo_url text, p_college text, p_in_game_id text
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_team uuid;
begin
  if v_uid is null then raise exception 'You need to be logged in.'; end if;
  if coalesce(trim(p_in_game_id), '') = '' then raise exception 'Enter your in-game ID.'; end if;
  if exists (select 1 from team_members m join teams t on t.id = m.team_id where m.profile_id = v_uid and t.game = p_game) then
    raise exception 'You are already on a team for this game. Leave it first.';
  end if;
  if exists (select 1 from teams where game = p_game and lower(name) = lower(trim(p_name))) then
    raise exception 'A team with this name already exists for this game.';
  end if;

  insert into teams (name, tag, game, color, logo_url, captain_id, college)
  values (trim(p_name), p_tag, p_game, coalesce(p_color, '#C6FF3D'), p_logo_url, v_uid, coalesce(p_college, ''))
  returning id into v_team;
  insert into team_invites (team_id, code) values (v_team, new_invite_code());
  insert into team_members (team_id, profile_id, in_game_id, role) values (v_team, v_uid, trim(p_in_game_id), 'captain');
  update profiles set game_ids = game_ids || jsonb_build_object(p_game, trim(p_in_game_id)) where id = v_uid;
  perform log_activity('team', 'New team created: ' || trim(p_name));
  return v_team;
end $$;

create or replace function public.join_team_by_code(p_code text, p_in_game_id text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_team teams%rowtype;
  v_count int;
  v_max int;
begin
  if v_uid is null then raise exception 'You need to be logged in.'; end if;
  if coalesce(trim(p_in_game_id), '') = '' then raise exception 'Enter your in-game ID.'; end if;
  select t.* into v_team from teams t join team_invites i on i.team_id = t.id where i.code = upper(trim(p_code)) for update of t;
  if not found then raise exception 'Invite code not found. Check it with your captain.'; end if;
  if exists (select 1 from team_members where team_id = v_team.id and profile_id = v_uid) then raise exception 'You are already on this team.'; end if;
  if exists (select 1 from team_members m join teams t on t.id = m.team_id where m.profile_id = v_uid and t.game = v_team.game) then
    raise exception 'You are already on another team for this game.';
  end if;
  if team_roster_locked(v_team.id) then raise exception 'This team''s roster is locked while it is competing.'; end if;
  select count(*) into v_count from team_members where team_id = v_team.id;
  select max_players into v_max from format_roster_limits(game_default_format(v_team.game));
  if v_count >= v_max then raise exception 'This team''s roster is full.'; end if;

  insert into team_members (team_id, profile_id, in_game_id, role) values (v_team.id, v_uid, trim(p_in_game_id), 'player');
  update profiles set game_ids = game_ids || jsonb_build_object(v_team.game, trim(p_in_game_id)) where id = v_uid;
  return v_team.id;
end $$;

create or replace function public.leave_team(p_team_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from teams where id = p_team_id and captain_id = auth.uid()) then
    raise exception 'Captains must transfer captaincy before leaving.';
  end if;
  if team_roster_locked(p_team_id) then raise exception 'Roster is locked while the team is competing.'; end if;
  delete from team_members where team_id = p_team_id and profile_id = auth.uid();
end $$;

create or replace function public.remove_team_member(p_team_id uuid, p_profile_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_captain uuid;
begin
  select captain_id into v_captain from teams where id = p_team_id;
  if v_captain is null then raise exception 'Team not found.'; end if;
  if v_captain <> auth.uid() and not is_admin() then raise exception 'Only the team captain can do that.'; end if;
  if p_profile_id = v_captain then raise exception 'The captain cannot be removed.'; end if;
  if team_roster_locked(p_team_id) then raise exception 'Roster is locked while the team is competing.'; end if;
  delete from team_members where team_id = p_team_id and profile_id = p_profile_id;
end $$;

create or replace function public.transfer_captain(p_team_id uuid, p_profile_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from teams where id = p_team_id and (captain_id = auth.uid() or is_admin())) then
    raise exception 'Only the team captain can do that.';
  end if;
  if not exists (select 1 from team_members where team_id = p_team_id and profile_id = p_profile_id) then
    raise exception 'That player is not on this team.';
  end if;
  perform set_config('esh.allow_team_admin', 'on', true);
  update teams set captain_id = p_profile_id where id = p_team_id;
  perform set_config('esh.allow_team_admin', 'off', true);
  update team_members set role = case when profile_id = p_profile_id then 'captain' else 'player' end where team_id = p_team_id;
end $$;

create or replace function public.regenerate_invite_code(p_team_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v_code text := new_invite_code();
begin
  if not exists (select 1 from teams where id = p_team_id and captain_id = auth.uid()) then
    raise exception 'Only the team captain can do that.';
  end if;
  update team_invites set code = v_code, created_at = now() where team_id = p_team_id;
  return v_code;
end $$;

create or replace function public.delete_team(p_team_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_name text;
begin
  select name into v_name from teams where id = p_team_id and (captain_id = auth.uid() or is_admin());
  if v_name is null then raise exception 'Only the captain or an admin can delete a team.'; end if;
  if exists (select 1 from match_results where team_id = p_team_id) or exists (select 1 from match_participants where team_id = p_team_id) then
    raise exception 'Teams with match history cannot be deleted.';
  end if;
  if exists (select 1 from tournament_registrations where team_id = p_team_id and status in ('pending','approved')) then
    raise exception 'Withdraw from active tournaments first.';
  end if;
  delete from teams where id = p_team_id;
  perform log_activity('team', 'Team deleted: ' || v_name);
end $$;

-- ---------- registrations ----------
-- Atomic registration: the tournament row is locked so concurrent requests
-- cannot exceed capacity. Mirrors checkRegistration() in src/utils/registrationRules.js.
create or replace function public.register_team(p_tournament_id uuid, p_team_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  t tournaments%rowtype;
  tm teams%rowtype;
  v_active int;
  v_roster int;
  v_min int;
  v_max int;
  v_status text;
begin
  if v_uid is null then raise exception 'Log in to register a team.'; end if;
  select * into t from tournaments where id = p_tournament_id for update;
  if not found then raise exception 'Tournament not found.'; end if;
  if t.status <> 'open' then raise exception 'Registration is not open for this tournament.'; end if;
  if t.reg_deadline <= now() then raise exception 'The registration deadline has passed.'; end if;

  select * into tm from teams where id = p_team_id;
  if not found then raise exception 'Team not found.'; end if;
  if tm.captain_id <> v_uid then raise exception 'Only the team captain can register the team.'; end if;
  if tm.game <> t.game then raise exception 'This team plays a different game.'; end if;
  if exists (select 1 from tournament_registrations where tournament_id = t.id and team_id = tm.id and status in ('pending','approved')) then
    raise exception 'This team is already registered.';
  end if;

  select count(*) into v_active from tournament_registrations where tournament_id = t.id and status in ('pending','approved');
  if v_active >= t.max_teams then raise exception 'All team slots are filled.'; end if;

  select count(*) into v_roster from team_members where team_id = tm.id;
  select min_players, max_players into v_min, v_max from format_roster_limits(t.format);
  if v_roster < v_min then raise exception 'Needs at least % players — roster has %.', v_min, v_roster; end if;
  if v_roster > v_max then raise exception 'Roster too large: maximum % including substitutes.', v_max; end if;

  if exists (
    select 1 from team_members m
    join tournament_registrations r on r.team_id = m.team_id and r.tournament_id = t.id and r.status in ('pending','approved')
    where m.profile_id in (select profile_id from team_members where team_id = tm.id)
  ) then
    raise exception 'A player on your roster is already registered with another team in this tournament.';
  end if;

  v_status := case when t.requires_approval then 'pending' else 'approved' end;
  insert into tournament_registrations (tournament_id, team_id, status)
  values (t.id, tm.id, v_status)
  on conflict (tournament_id, team_id) do update set status = excluded.status;
  perform log_activity('registration', tm.name || ' registered for ' || t.name);
  return v_status;
end $$;

create or replace function public.withdraw_registration(p_registration_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  r tournament_registrations%rowtype;
  t tournaments%rowtype;
begin
  select * into r from tournament_registrations where id = p_registration_id for update;
  if not found or r.status not in ('pending','approved') then raise exception 'No active registration.'; end if;
  if not exists (select 1 from teams where id = r.team_id and captain_id = auth.uid()) then
    raise exception 'Only the captain can withdraw the team.';
  end if;
  select * into t from tournaments where id = r.tournament_id;
  if t.status <> 'open' or t.reg_deadline <= now() then raise exception 'Withdrawals close at the registration deadline.'; end if;
  update tournament_registrations set status = 'withdrawn' where id = r.id;
end $$;

create or replace function public.admin_set_registration_status(p_registration_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
declare
  r tournament_registrations%rowtype;
  t tournaments%rowtype;
  v_approved int;
begin
  if not is_admin() then raise exception 'Admin permission required.'; end if;
  if p_status not in ('pending','approved','rejected','withdrawn') then raise exception 'Invalid status.'; end if;
  select * into r from tournament_registrations where id = p_registration_id;
  if not found then raise exception 'Registration not found.'; end if;
  select * into t from tournaments where id = r.tournament_id for update;
  if p_status = 'approved' and r.status <> 'approved' then
    select count(*) into v_approved from tournament_registrations where tournament_id = t.id and status = 'approved';
    if v_approved >= t.max_teams then raise exception 'Tournament capacity reached.'; end if;
  end if;
  update tournament_registrations set status = p_status where id = r.id;
  perform log_activity('registration', (select name from teams where id = r.team_id) || ' ' || p_status || ' for ' || t.name);
end $$;

-- ---------- admin: roles ----------
create or replace function public.admin_set_role(p_profile_id uuid, p_role text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Admin permission required.'; end if;
  if p_role not in ('player','admin') then raise exception 'Invalid role.'; end if;
  if p_profile_id = auth.uid() and p_role <> 'admin' then raise exception 'You cannot remove your own admin role.'; end if;
  update profiles set role = p_role where id = p_profile_id;
  perform log_activity('player', (select username from profiles where id = p_profile_id) || ' role → ' || p_role);
end $$;

-- ---------- admin: matches & results ----------
create or replace function public.admin_save_match(
  p_id uuid, p_tournament_id uuid, p_round text, p_scheduled_at timestamptz, p_status text, p_map text, p_participants uuid[]
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid := p_id;
begin
  if not is_admin() then raise exception 'Admin permission required.'; end if;
  if coalesce(trim(p_round), '') = '' then raise exception 'Enter a round name.'; end if;
  if exists (
    select 1 from unnest(p_participants) as pid
    where not exists (select 1 from tournament_registrations where tournament_id = p_tournament_id and team_id = pid and status = 'approved')
  ) then
    raise exception 'Only approved teams can be scheduled.';
  end if;

  if v_id is null then
    insert into matches (tournament_id, round, scheduled_at, status, map)
    values (p_tournament_id, trim(p_round), p_scheduled_at, coalesce(p_status, 'scheduled'), coalesce(p_map, ''))
    returning id into v_id;
    perform log_activity('match', 'Match scheduled: ' || trim(p_round));
  else
    update matches set round = trim(p_round), scheduled_at = p_scheduled_at, status = coalesce(p_status, status), map = coalesce(p_map, '')
    where id = v_id and tournament_id = p_tournament_id;
    if not found then raise exception 'Match not found.'; end if;
    delete from match_results where match_id = v_id and team_id <> all (p_participants);
    delete from match_participants where match_id = v_id and team_id <> all (p_participants);
  end if;

  insert into match_participants (match_id, team_id)
  select v_id, pid from unnest(p_participants) as pid
  on conflict do nothing;
  return v_id;
end $$;

-- p_results: [{ "team_id": uuid, "score": int|null, "placement": int|null, "kills": int|null, "is_winner": bool }]
create or replace function public.admin_save_results(p_match_id uuid, p_results jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_parts int;
  v_given int;
begin
  if not is_admin() then raise exception 'Admin permission required.'; end if;
  select count(*) into v_parts from match_participants where match_id = p_match_id;
  select count(*) into v_given from jsonb_array_elements(p_results) e
    where exists (select 1 from match_participants where match_id = p_match_id and team_id = (e->>'team_id')::uuid);
  if v_given <> jsonb_array_length(p_results) then raise exception 'Results include a team not in this match.'; end if;
  if v_given <> v_parts then raise exception 'Enter a result for every team.'; end if;

  delete from match_results where match_id = p_match_id;
  insert into match_results (match_id, team_id, score, placement, kills, is_winner)
  select p_match_id, (e->>'team_id')::uuid, (e->>'score')::int, (e->>'placement')::int, (e->>'kills')::int, coalesce((e->>'is_winner')::boolean, false)
  from jsonb_array_elements(p_results) e;
  update matches set status = 'completed' where id = p_match_id;
  perform log_activity('result', 'Result posted for match ' || (select round from matches where id = p_match_id));
end $$;

-- ---------- execute permissions ----------
-- Postgres grants EXECUTE to PUBLIC by default (and Supabase to anon/authenticated),
-- so revoke broadly, then grant back only the intended entry points.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function
  public.create_team(text, text, text, text, text, text, text),
  public.join_team_by_code(text, text),
  public.leave_team(uuid),
  public.remove_team_member(uuid, uuid),
  public.transfer_captain(uuid, uuid),
  public.regenerate_invite_code(uuid),
  public.delete_team(uuid),
  public.register_team(uuid, uuid),
  public.withdraw_registration(uuid),
  public.admin_set_registration_status(uuid, text),
  public.admin_set_role(uuid, text),
  public.admin_save_match(uuid, uuid, text, timestamptz, text, text, uuid[]),
  public.admin_save_results(uuid, jsonb)
to authenticated;
-- RLS helper functions must stay callable for policy evaluation by anonymous readers.
grant execute on function public.is_admin(), public.is_team_member(uuid) to anon, authenticated;
