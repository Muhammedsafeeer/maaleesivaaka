-- Phase 15: Supabase Realtime needs a table added to the supabase_realtime publication
-- before postgres_changes events fire for it — no table was in the publication until
-- now. Only `results`, per src/hooks/README.md's already-planned useRealtimeLeaderboard
-- hook and D-002's consequence #3 (Postgres views don't emit Realtime events; subscribe
-- to the underlying table and re-read the view).
--
-- RLS still applies to who receives which row's events (Realtime respects the same
-- policies as normal reads), so this doesn't widen any existing access — it only turns
-- on change notifications for a table admins/anon could already SELECT from.

alter publication supabase_realtime add table results;
