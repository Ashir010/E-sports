-- =====================================================================
-- Esports Tournament Hub — 001 schema
-- Run in order: 001_schema.sql → 002_rls.sql → 003_functions.sql
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- helpers ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- profiles (1:1 with auth.users) ----------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text not null,
  display_name  text not null,
  avatar_url    text,
  avatar_color  text default '#8B5CF6',
  college       text not null default '',
  favorite_game text check (favorite_game in ('bgmi','valorant','freefire','minimilitia')),
  game_ids      jsonb not null default '{}'::jsonb,
  bio           text default '' check (char_length(bio) <= 200),
  role          text not null default 'player' check (role in ('player','admin')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint username_format check (username ~ '^[A-Za-z0-9_.]{3,20}$')
);
create unique index if not exists profiles_username_lower_idx on public.profiles (lower(username));
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

-- ---------- tournaments ----------
create table if not exists public.tournaments (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null check (char_length(name) between 4 and 80),
  description        text default '',
  game               text not null check (game in ('bgmi','valorant','freefire','minimilitia')),
  format             text not null check (format in ('solo','duo','squad','5v5')),
  team_size          int  not null check (team_size between 1 and 5),
  max_teams          int  not null check (max_teams between 2 and 256),
  entry_fee          numeric(10,2) not null default 0 check (entry_fee >= 0),
  prize_pool         numeric(12,2) not null default 0 check (prize_pool >= 0),
  prize_distribution jsonb not null default '[]'::jsonb,   -- [{ "place": "1st", "amount": 25000 }]
  scoring_rules      jsonb not null,                        -- { "type":"h2h","win":3,"draw":1,"loss":0 } | { "type":"br","killPoints":1,"placementPoints":[15,12,...] }
  rules              jsonb not null default '[]'::jsonb,    -- ["rule 1", ...]
  requirements       jsonb not null default '[]'::jsonb,
  reg_deadline       timestamptz not null,
  start_at           timestamptz not null,
  end_at             timestamptz,
  status             text not null default 'draft' check (status in ('draft','open','upcoming','ongoing','completed','cancelled')),
  requires_approval  boolean not null default false,
  featured           boolean not null default false,
  mode               text not null default 'Online',
  created_by         uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint deadline_before_start check (reg_deadline <= start_at)
);
create index if not exists tournaments_status_idx on public.tournaments (status);
create index if not exists tournaments_game_idx on public.tournaments (game);
create index if not exists tournaments_start_idx on public.tournaments (start_at);
drop trigger if exists tournaments_updated_at on public.tournaments;
create trigger tournaments_updated_at before update on public.tournaments for each row execute function public.set_updated_at();

-- ---------- teams ----------
create table if not exists public.teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 3 and 24),
  tag         text not null check (tag ~ '^[A-Z0-9]{2,5}$'),
  game        text not null check (game in ('bgmi','valorant','freefire','minimilitia')),
  color       text not null default '#C6FF3D',
  logo_url    text,
  captain_id  uuid not null references public.profiles(id) on delete restrict,
  college     text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index if not exists teams_game_name_idx on public.teams (game, lower(name));
create index if not exists teams_captain_idx on public.teams (captain_id);
drop trigger if exists teams_updated_at on public.teams;
create trigger teams_updated_at before update on public.teams for each row execute function public.set_updated_at();

-- Invite codes live in their own table so only team members can read them.
create table if not exists public.team_invites (
  team_id    uuid primary key references public.teams(id) on delete cascade,
  code       text not null unique check (code ~ '^[A-Z0-9]{6,10}$'),
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  in_game_id  text not null check (char_length(in_game_id) between 1 and 40),
  role        text not null default 'player' check (role in ('captain','player')),
  joined_at   timestamptz not null default now(),
  unique (team_id, profile_id)
);
create index if not exists team_members_profile_idx on public.team_members (profile_id);

-- ---------- registrations ----------
create table if not exists public.tournament_registrations (
  id             uuid primary key default gen_random_uuid(),
  tournament_id  uuid not null references public.tournaments(id) on delete cascade,
  team_id        uuid not null references public.teams(id) on delete cascade,
  status         text not null default 'pending' check (status in ('pending','approved','rejected','withdrawn')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (tournament_id, team_id)          -- prevents duplicate registrations
);
create index if not exists registrations_tournament_status_idx on public.tournament_registrations (tournament_id, status);
create index if not exists registrations_team_idx on public.tournament_registrations (team_id);
drop trigger if exists registrations_updated_at on public.tournament_registrations;
create trigger registrations_updated_at before update on public.tournament_registrations for each row execute function public.set_updated_at();

-- ---------- matches ----------
create table if not exists public.matches (
  id             uuid primary key default gen_random_uuid(),
  tournament_id  uuid not null references public.tournaments(id) on delete cascade,
  round          text not null,
  scheduled_at   timestamptz not null,
  status         text not null default 'scheduled' check (status in ('scheduled','in_progress','completed','cancelled')),
  map            text default '',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists matches_tournament_idx on public.matches (tournament_id);
create index if not exists matches_scheduled_idx on public.matches (scheduled_at);
create index if not exists matches_status_idx on public.matches (status);
drop trigger if exists matches_updated_at on public.matches;
create trigger matches_updated_at before update on public.matches for each row execute function public.set_updated_at();

create table if not exists public.match_participants (
  match_id  uuid not null references public.matches(id) on delete cascade,
  team_id   uuid not null references public.teams(id) on delete restrict,
  primary key (match_id, team_id)
);
create index if not exists match_participants_team_idx on public.match_participants (team_id);

create table if not exists public.match_results (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.matches(id) on delete cascade,
  team_id    uuid not null references public.teams(id) on delete restrict,
  score      int check (score >= 0),         -- head-to-head
  placement  int check (placement >= 1),     -- battle royale
  kills      int check (kills >= 0),         -- battle royale
  is_winner  boolean not null default false,
  created_at timestamptz not null default now(),
  unique (match_id, team_id)
);
create index if not exists match_results_team_idx on public.match_results (team_id);

-- ---------- achievements (admin-awarded extras; most achievements are computed in the app) ----------
create table if not exists public.achievements (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  description text default '',
  icon        text default 'trophy',
  awarded_at  timestamptz not null default now()
);
create index if not exists achievements_profile_idx on public.achievements (profile_id);

-- ---------- activity log (admin dashboard feed) ----------
create table if not exists public.activity_log (
  id         uuid primary key default gen_random_uuid(),
  type       text not null,
  message    text not null,
  actor_id   uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists activity_created_idx on public.activity_log (created_at desc);

-- ---------- auto-create a profile when a user signs up ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_username text := nullif(trim(new.raw_user_meta_data->>'username'), '');
begin
  if v_username is null or v_username !~ '^[A-Za-z0-9_.]{3,20}$'
     or exists (select 1 from public.profiles where lower(username) = lower(v_username)) then
    v_username := 'player_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  insert into public.profiles (id, username, display_name, college, favorite_game)
  values (
    new.id,
    v_username,
    coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), v_username),
    coalesce(new.raw_user_meta_data->>'college', ''),
    case when new.raw_user_meta_data->>'favorite_game' in ('bgmi','valorant','freefire','minimilitia')
         then new.raw_user_meta_data->>'favorite_game' end
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
