-- D-021: extend participant_category beyond the original kids/junior/senior set.
-- New values are appended in age order around the existing ones; 'general' sits last
-- because it is not an age band.
--
-- ADD VALUE cannot be used in the same transaction as a query that reads the new
-- labels — this migration only adds them, so it is safe under Supabase's default
-- transactional migrate.

alter type participant_category add value if not exists 'sub_junior' after 'kids';
alter type participant_category add value if not exists 'super_senior' after 'senior';
alter type participant_category add value if not exists 'general';
