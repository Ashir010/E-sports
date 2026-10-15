# Esports Hub — College Tournament Platform

A full-stack web app for running college esports tournaments in **BGMI, Valorant, Free Fire and Mini Militia**. Students can discover tournaments, build teams with invite codes, register, follow the schedule and climb leaderboards. Admins run everything from a protected dashboard.

**Stack:** React 18 + Vite · Tailwind CSS · Framer Motion · Lucide · React Router · Recharts · Supabase (Postgres, Auth, Storage, RLS) · Vitest

---

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase URL + anon key (see below)
npm run dev                  # http://localhost:5173
```

All data (tournaments, teams, players, matches, results) lives in your **Supabase** database. There is no fake or sample data: the platform starts empty, and content comes from real sign-ups and what admins create. Without credentials, the app shows a setup screen.

Other scripts:

```bash
npm test           # unit tests for scoring, registration rules, validation, filters
npm run build      # production build to dist/
npm run preview    # serve the production build
```

### First run checklist

1. Sign up with your organiser account, then make it admin (see *Creating the first admin* below).
2. *Admin → Tournaments → New tournament*: create one and set status to **Registration Open**.
3. Players sign up, create a team (*Teams → Create a team*), share the invite code, and the captain registers.
4. *Admin → Registrations* (if approval is on), then *Admin → Matches*: schedule matches and enter results. Leaderboards update automatically.

---

## Features

| Area | What works |
|---|---|
| **Home** | Hero built from live data, game tiles, featured tournaments (game tabs, search, sort, empty state), upcoming matches, leaderboard preview, how it works, player spotlight, CTA, footer |
| **Tournaments** | Grid/list views, search, filters (game, status, format, entry fee), sorting (date, prize, popularity), Load More, filters synced to the URL |
| **Tournament detail** | Overview, prize distribution, entry requirements, team size, scoring explanation, schedule, registered teams, bracket + standings, rules, registration panel aware of auth, status, deadline, capacity, captaincy, roster size and duplicates |
| **Teams** | Create (logo upload or colour monogram), invite code + link, join by code, captain transfer, remove member, leave, edit, delete, register/withdraw |
| **Auth & profiles** | Supabase sign-up/login/logout, password reset, session persistence, protected routes, editable profile with avatar, gaming IDs, computed achievements, stats, match history |
| **Leaderboard** | Team + player rankings, overall/game/tournament scopes, search, top-3 podium, rank movement, points-race and win-rate charts |
| **Matches** | List + month calendar (IST), status/game/tournament filters, match detail with results and rosters |
| **Admin** | Overview KPIs, activity feed and chart; tournament CRUD + publish/close/start/complete/cancel; approve/reject registrations (capacity enforced); manage teams and player roles; schedule matches; enter H2H or battle-royale results; regenerate standings; settings |

### Scoring (always computed, never hand-edited)

- **Head-to-head** (Valorant, Mini Militia): win 3 · draw 1 · loss 0 by default.
- **Battle royale** (BGMI, Free Fire): placement points `15,12,10,8,6,4,2,1,1,1,0,0` + 1 per kill by default. A 1st-place finish counts as a win.
- Rules are **configurable per tournament** in the admin tournament editor.
- **Overall (cross-game)** rankings use *circuit points* so BR point totals don't drown out H2H: 3 per win (BR: 1st place), 1 per draw or top-half lobby finish.

The logic lives in [`src/utils/scoring.js`](src/utils/scoring.js) and is covered by tests.

---

## Connecting Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run these files in order:
   1. [`supabase/migrations/001_schema.sql`](supabase/migrations/001_schema.sql): tables, constraints, indexes, profile-on-signup trigger
   2. [`supabase/migrations/002_rls.sql`](supabase/migrations/002_rls.sql): row level security policies and the `media` storage bucket
   3. [`supabase/migrations/003_functions.sql`](supabase/migrations/003_functions.sql): secure functions for teams, registrations and admin actions
3. Copy `.env.example` to `.env.local` and fill in values from **Project Settings → API**:

   ```env
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

   Use the **anon public** key only. **Never** put the `service_role` key in any `VITE_` variable or frontend code; Vite would ship it to every visitor.
4. Under **Authentication → URL Configuration**, set the Site URL (e.g. `http://localhost:5173`, later your Vercel URL) and add `<site>/reset-password` and `<site>/login` to the redirect URLs.
5. Restart `npm run dev`.

### Creating the first admin securely

Admin rights can't be self-assigned: a trigger blocks users from changing their own `role`. To bootstrap:

1. Sign up through the app with your organiser account.
2. In the Supabase **SQL Editor** (which runs with owner privileges), run:

   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@college.edu');
   ```

3. Log out and back in. From then on, admins can promote other users from **Admin → Players**.

### Security model

- **RLS everywhere.** Public competition data (published tournaments, teams, rosters, matches, results) is readable by everyone. Drafts are visible only to admins, and invite codes only to team members.
- **No direct writes to sensitive tables.** Registrations, roster changes, match scheduling and results go through `SECURITY DEFINER` functions that check `auth.uid()` / `is_admin()` themselves.
- **`register_team()` is atomic.** It locks the tournament row (`FOR UPDATE`), then checks status, deadline, capacity, captaincy, game, roster size, duplicates and player conflicts before inserting. A `unique (tournament_id, team_id)` constraint is the final guard against duplicates.
- **The frontend admin gate is cosmetic.** `AdminRoute` hides admin pages, but the database rejects any admin write from a non-admin.
- Passwords and tokens are handled entirely by Supabase Auth. The `profiles` table holds no email or secrets.

> **Why no Express server?** Every rule that needs server-side enforcement is enforced inside Postgres via RLS and database functions, which is more secure than a separate API and means one less service to host. If you later need webhooks or payment processing, add a Supabase Edge Function or a small Node service that uses the service-role key **server-side only**.

---

## Deploying to Vercel

1. Push the repo to GitHub (`.env.local` is git-ignored, so check that no secrets are committed).
2. In Vercel, **Add New Project** and import the repo. The framework preset is *Vite*, the build command `npm run build`, and the output directory `dist`.
3. Add environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Deploy. [`vercel.json`](vercel.json) rewrites all routes to `index.html` so deep links like `/tournaments/xyz` work.
5. Add the Vercel URL to Supabase **Auth → URL Configuration**.

Without the env vars the deployed site shows the setup screen.

---

## Project structure

```
src/
  components/
    ui/            Button, Badge, Field (Input/Select/Textarea/Checkbox), Modal + ConfirmDialog, Tabs, States, Avatar/TeamLogo, GameArt
    layout/        Navbar (sticky, mobile menu), Footer, SetupRequired, Logo, Motion helpers
    tournaments/   TournamentCard, RegisterPanel, Bracket
    matches/       MatchCard, MatchCalendar
    leaderboard/   LeaderboardTable, Podium, PerformanceCharts
    teams/ players/ admin/ home/
  pages/
    public/        Home, Tournaments, TournamentDetail, Leaderboard, Matches, MatchDetail, Teams, TeamDetail, PlayerProfile, InfoPage, NotFound
    auth/          Login, Signup, ForgotPassword, ResetPassword
    player/        Dashboard, EditProfile, MyTeams, CreateTeam, JoinTeam, ManageTeam
    admin/         Overview, Tournaments, Registrations, Teams, Players, Matches, Leaderboard, Settings
  layouts/         PublicLayout, AdminLayout, RouteGuards (ProtectedRoute, AdminRoute)
  context/         DataContext (snapshot + refresh), AuthContext, ToastContext
  services/        api.js, supabaseApi.js (all reads/writes go to Supabase)
  utils/           scoring, registrationRules, validation, tournamentFilters, selectors, format
  lib/             supabase client, constants (games, formats, timezone)
supabase/          SQL migrations + optional seed
```

All dates are entered and shown in **IST (Asia/Kolkata)** and stored as UTC.

## Known limitations

- No payment processing: entry fees are displayed only and collected by organisers offline.
- No email delivery for team invites: invites use codes or links, by design.
- No live score feed: match results are entered by admins. *In progress* only means an admin marked the match as started.
- Each read loads a full snapshot of the competition tables, which is fine at college scale (hundreds of teams). At much larger scale, switch to paginated queries or SQL views.
