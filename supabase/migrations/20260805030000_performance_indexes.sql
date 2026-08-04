-- Additional indexes for query patterns that grew after the initial schema
-- (20260730071226_initial_schema.sql) and its later additions — none of these change
-- behavior, only how fast the existing queries run as the tables grow.

-- ============================================================================
-- pg_trgm: needed for ILIKE '%...%' (leading-wildcard) searches. A plain btree index
-- can't serve those at all — Postgres falls back to a full table scan — this is the
-- only way to make them index-backed.
-- ============================================================================

create extension if not exists pg_trgm;

-- Admin students search (src/lib/services/student.service.ts's listStudents:
-- `.or('name.ilike.%q%,roll_number.ilike.%q%')`) and the audience "Find My Result"
-- search (search_student_results, 20260804000000_search_student_results.sql:
-- `name ilike '%' || v_query || '%'`).
create index students_name_trgm_idx on students using gin (name gin_trgm_ops);
create index students_roll_number_trgm_idx on students using gin (roll_number gin_trgm_ops);

-- Admin programs search (src/lib/services/program.service.ts's listPrograms:
-- `.ilike('name', '%q%')`).
create index programs_name_trgm_idx on programs using gin (name gin_trgm_ops);

-- ============================================================================
-- students.roll_number: search_student_results also does an exact-match lookup
-- (`roll_number = v_query`, deliberately not scoped to a class — the caller doesn't
-- know the student's class, only their roll number or name). The
-- students_class_roll_number_key unique constraint (20260805020000) indexes
-- (class, roll_number) with class leading, which can't serve a roll_number-only
-- equality lookup — this plain index on roll_number alone is what that needs.
-- ============================================================================

create index students_roll_number_idx on students (roll_number);

-- ============================================================================
-- results.updated_at: the audience page's two "recent activity" panels both sort by
-- this with a LIMIT — listLatestPublishedResults (top N most recent results overall)
-- and listLatestProgramPodium's first query (which program was updated most
-- recently) — both in src/lib/services/result.service.ts. Without this, each is a
-- full sort of the whole results table just to return a handful of rows.
-- ============================================================================

create index results_updated_at_idx on results (updated_at desc);

-- results.position: listProgramWinners (result.service.ts) filters `position = 1`
-- across every program's results, with no program_id in the predicate — the existing
-- results_student_id_idx and the program_id auto-index (leading column of
-- unique(program_id, student_id)) don't help a table-wide position filter.
create index results_position_idx on results (position);

-- ============================================================================
-- profiles.role: filtered on its own (no other predicate) in several places —
-- listJudges/getJudge (judge.service.ts), the dashboard's judge count
-- (dashboard.service.ts), available-judges-for-assignment (assignment.service.ts),
-- and the admin-emails lookup (auth.service.ts). profiles is small today (one row per
-- admin/judge account), so this is low-cost insurance rather than an urgent fix.
-- ============================================================================

create index profiles_role_idx on profiles (role);
