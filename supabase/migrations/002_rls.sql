-- =====================================================================
-- Esports Tournament Hub — 002 row level security
-- Principle: everyone may READ public competition data; WRITES happen only
-- through narrowly-scoped policies or SECURITY DEFINER functions (003).
-- =====================================================================

-- Admin check used by policies and functions. SECURITY DEFINER avoids RLS recursion on profiles.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_team_member(p_team_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.team_members where team_id = p_team_id and profile_id = auth.uid());
$$;

alter table public.profiles                 enable row level security;
alter table public.tournaments              enable row level security;
alter table public.teams                    enable row level security;
alter table public.team_invites             enable row level security;
alter table public.team_members             enable row level security;
alter table public.tournament_registrations enable row level security;
alter table public.matches                  enable row level security;
alter table public.match_participants       enable row level security;
alter table public.match_results            enable row level security;
alter table public.achievements             enable row level security;
alter table public.activity_log             enable row level security;

-- ---------- profiles ----------
-- Public gamer profiles (no email or auth data lives in this table).
drop policy if exists "profiles are public" on public.profiles;
create policy "profiles are public" on public.profiles for select using (true);
drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- Users can never promote themselves: role changes require an admin (or the SQL editor).
create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'Only admins can change roles.';
  end if;
  return new;
end $$;
drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role before update on public.profiles for each row execute function public.protect_profile_role();

-- ---------- tournaments ----------
drop policy if exists "published tournaments are public" on public.tournaments;
create policy "published tournaments are public" on public.tournaments for select
  using (status <> 'draft' or public.is_admin());
drop policy if exists "admins insert tournaments" on public.tournaments;
create policy "admins insert tournaments" on public.tournaments for insert with check (public.is_admin());
drop policy if exists "admins update tournaments" on public.tournaments;
create policy "admins update tournaments" on public.tournaments for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins delete tournaments" on public.tournaments;
create policy "admins delete tournaments" on public.tournaments for delete using (public.is_admin());

-- ---------- teams ----------
drop policy if exists "teams are public" on public.teams;
create policy "teams are public" on public.teams for select using (true);
-- Captains edit cosmetic details; game and captain changes are blocked by trigger below.
drop policy if exists "captains update own team" on public.teams;
create policy "captains update own team" on public.teams for update
  using (captain_id = auth.uid() or public.is_admin())
  with check (captain_id = auth.uid() or public.is_admin());
-- Inserts/deletes go through create_team() / delete_team().

create or replace function public.protect_team_columns()
returns trigger language plpgsql as $$
begin
  -- Functions running as owner set this flag to allow captain transfers.
  if coalesce(current_setting('esh.allow_team_admin', true), '') = 'on' then
    return new;
  end if;
  if new.game is distinct from old.game then
    raise exception 'A team''s game cannot be changed.';
  end if;
  if new.captain_id is distinct from old.captain_id then
    raise exception 'Use transfer_captain() to change the captain.';
  end if;
  return new;
end $$;
drop trigger if exists teams_protect_columns on public.teams;
create trigger teams_protect_columns before update on public.teams for each row execute function public.protect_team_columns();

-- Invite codes: visible only to members of that team (and admins).
drop policy if exists "members read invite code" on public.team_invites;
create policy "members read invite code" on public.team_invites for select
  using (public.is_team_member(team_id) or public.is_admin());

-- ---------- team members ----------
drop policy if exists "rosters are public" on public.team_members;
create policy "rosters are public" on public.team_members for select using (true);
-- All roster changes go through join_team_by_code(), leave_team(), remove_team_member(), transfer_captain().

-- ---------- registrations ----------
drop policy if exists "registrations are public" on public.tournament_registrations;
create policy "registrations are public" on public.tournament_registrations for select using (true);
-- Writes only through register_team(), withdraw_registration(), admin_set_registration_status().

-- ---------- matches / participants / results ----------
drop policy if exists "matches are public" on public.matches;
create policy "matches are public" on public.matches for select
  using (exists (select 1 from public.tournaments t where t.id = tournament_id and (t.status <> 'draft' or public.is_admin())));
drop policy if exists "admins delete matches" on public.matches;
create policy "admins delete matches" on public.matches for delete using (public.is_admin());
drop policy if exists "admins update matches" on public.matches;
create policy "admins update matches" on public.matches for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "participants are public" on public.match_participants;
create policy "participants are public" on public.match_participants for select using (true);
drop policy if exists "results are public" on public.match_results;
create policy "results are public" on public.match_results for select using (true);
-- Inserts go through admin_save_match() / admin_save_results().

-- ---------- achievements ----------
drop policy if exists "achievements are public" on public.achievements;
create policy "achievements are public" on public.achievements for select using (true);
drop policy if exists "admins manage achievements" on public.achievements;
create policy "admins manage achievements" on public.achievements for all using (public.is_admin()) with check (public.is_admin());

-- ---------- activity log ----------
drop policy if exists "admins read activity" on public.activity_log;
create policy "admins read activity" on public.activity_log for select using (public.is_admin());

-- ---------- storage: public 'media' bucket for avatars and team logos ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 2097152, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

drop policy if exists "media is publicly readable" on storage.objects;
create policy "media is publicly readable" on storage.objects for select using (bucket_id = 'media');
drop policy if exists "users upload to own folder" on storage.objects;
create policy "users upload to own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "users delete own files" on storage.objects;
create policy "users delete own files" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
