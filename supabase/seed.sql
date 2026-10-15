-- =====================================================================
-- OPTIONAL DEMO SEED for a fresh Supabase project.
-- Inserts sample tournaments only (teams and players come from real sign-ups,
-- because every profile must belong to a real auth user).
-- Clearly labelled as demo data — delete these rows before going live:
--   delete from public.tournaments where description like '[DEMO]%';
-- =====================================================================

insert into public.tournaments
  (name, description, game, format, team_size, max_teams, entry_fee, prize_pool, prize_distribution, scoring_rules, rules, requirements, reg_deadline, start_at, end_at, status, requires_approval, featured)
values
  ('Valorant Campus Clash', '[DEMO] Eight college rosters, group stage Bo1, playoffs Bo3.', 'valorant', '5v5', 5, 8, 500, 50000,
   '[{"place":"1st","amount":25000},{"place":"2nd","amount":12500},{"place":"3rd–4th","amount":6250}]',
   '{"type":"h2h","win":3,"draw":1,"loss":0}',
   '["Players must be enrolled students with a valid college ID.","Check in 30 minutes before your first match.","Third-party tools are prohibited."]',
   '["Valid college ID","Verified Riot ID for every player"]',
   now() + interval '6 days', now() + interval '10 days', now() + interval '12 days', 'open', true, true),
  ('BGMI Erangel Showdown', '[DEMO] Six lobbies across Erangel and Miramar.', 'bgmi', 'squad', 4, 16, 200, 30000,
   '[{"place":"1st","amount":15000},{"place":"2nd","amount":9000},{"place":"3rd","amount":6000}]',
   '{"type":"br","killPoints":1,"placementPoints":[15,12,10,8,6,4,2,1,1,1,0,0]}',
   '["Lobby passwords are shared 15 minutes before each match.","Emulators are prohibited."]',
   '["Valid college ID","BGMI character ID for every player"]',
   now() + interval '4 days', now() + interval '8 days', now() + interval '9 days', 'open', false, true),
  ('Free Fire Booyah Cup', '[DEMO] A rapid-fire evening of Bermuda lobbies.', 'freefire', 'squad', 4, 12, 100, 15000,
   '[{"place":"1st","amount":9000},{"place":"2nd","amount":3750},{"place":"3rd","amount":2250}]',
   '{"type":"br","killPoints":1,"placementPoints":[12,9,8,7,6,5,4,3,2,1,0,0]}',
   '["Free Fire MAX only.","Teams must be in the lobby 10 minutes early."]',
   '["Valid college ID","Free Fire UID for every player"]',
   now() + interval '3 days', now() + interval '7 days', now() + interval '7 days', 'open', false, false),
  ('Mini Militia Doodle Duel', '[DEMO] Free-entry duo deathmatch. First to 30 kills.', 'minimilitia', 'duo', 2, 8, 0, 5000,
   '[{"place":"1st","amount":3000},{"place":"2nd","amount":2000}]',
   '{"type":"h2h","win":3,"draw":1,"loss":0}',
   '["Maps: Outpost and Catacombs.","No modded APKs."]',
   '["Valid college ID"]',
   now() + interval '5 days', now() + interval '9 days', now() + interval '10 days', 'open', false, true);
