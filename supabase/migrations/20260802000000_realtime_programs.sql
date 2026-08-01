-- programs was never added to the supabase_realtime publication (only `results` was,
-- in 20260730170000_realtime_results.sql) — so postgres_changes on `programs` has never
-- actually fired, even though useRealtimePrograms/RealtimeProgramsListener (née
-- RealtimeFixtureListener) has subscribed to it since Phase 17. That's why a status
-- change (a program starting, an admin override, a fixture auto-advance) never reached
-- the audience "Now Performing" card or a judge's own dashboard/scoring page without a
-- manual refresh — this table add is what actually turns those subscriptions on.
--
-- RLS still applies to who receives which row's events (Realtime respects the same
-- policies as normal reads — programs already has admin/judge/anon SELECT policies), so
-- this doesn't widen any existing access, only turns on change notifications for a
-- table each of those roles could already SELECT from.

alter publication supabase_realtime add table programs;
