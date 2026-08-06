-- Reconciles the remote ads table with 20260806020000's current (nullable) definition
-- of media_type/media_url. That definition was written to support AdFormDialog's
-- create-then-attach flow (create the row, upload keyed by its id, then attach the
-- URL — same two-step shape as main_groups.photo_url), but the remote table was
-- actually created by an earlier, interrupted push that ran an older copy of the file
-- where those columns were still NOT NULL — confirmed by a direct insert against the
-- live table failing with 23502 on media_type. This brings the live schema in line with
-- what the migration file (and the application code) has always assumed.

alter table ads alter column media_type drop not null;
alter table ads alter column media_url drop not null;
