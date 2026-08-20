-- ads and ad_media were never added to the supabase_realtime publication (only
-- `results`, `programs`, `program_judges`, and `judge_scores` were, in their own
-- migrations) — so postgres_changes on `ads`/`ad_media` has never actually fired, even
-- though useRealtimeAds/RealtimeAdsListener has subscribed to both since it was written.
-- That's why an admin's "Push to TV" toggle, a reorder, or a new media upload never
-- reached /tv or /audience without a manual refresh, while every other live-updating
-- piece of TV data (standings, now performing, results) worked fine — same bug class as
-- 20260802000000_realtime_programs.sql, just never fixed for ads.
--
-- RLS still applies to who receives which row's events (Realtime respects the same
-- policies as normal reads — both tables already have anon/authenticated SELECT
-- policies), so this doesn't widen any existing access, only turns on change
-- notifications for tables anyone could already SELECT from.

alter publication supabase_realtime add table ads;
alter publication supabase_realtime add table ad_media;
