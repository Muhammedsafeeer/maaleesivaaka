-- D-025 follow-up: optional cap on how many students can be in one team/set.
--
-- Admin-configurable per program (only meaningful for group programs, but stored on
-- `programs` generally rather than a separate table — one nullable column is simpler
-- than a join for a single optional integer). Null means no limit, the default and the
-- only valid state for individual programs. Enforced going forward only: lowering the
-- cap below an already-larger team's current size does not evict anyone — it just
-- blocks adding MORE members past the new limit (assignment.service.ts's assignStudents).

alter table programs
  add column max_team_size smallint check (max_team_size is null or max_team_size >= 1);
