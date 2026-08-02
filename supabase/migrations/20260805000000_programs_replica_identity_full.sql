-- The audience "results published" toast (useRealtimePublishAnnouncer) needs to tell
-- "just transitioned to published" apart from "already published, something else about
-- it changed" — it does that by comparing payload.old.status to payload.new.status on a
-- programs UPDATE event. Under the default REPLICA IDENTITY (primary key only),
-- Postgres's logical replication only includes the primary key in the old-row payload,
-- not the rest of the columns, so `old.status` would always be undefined and the toast
-- would refire on any edit to an already-published program, not just the actual publish.
-- FULL includes every column's prior value, making that comparison meaningful.

alter table programs replica identity full;
