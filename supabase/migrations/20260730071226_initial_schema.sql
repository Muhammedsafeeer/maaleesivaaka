-- Initial schema for the School Function Judging & Live Score Management System.
-- See docs/architecture.md §11 (table definitions), docs/decisions.md D-002/D-003/D-004/D-007
-- (leaderboard view, status lifecycle, tie handling, category-match trigger), and
-- docs/agents.md "Database Rules" / "Row Level Security" (uuid PKs, timestamps on every
-- table, RLS enabled everywhere, never disabled).
--
-- Enum labels mirror src/constants/*.ts exactly — that file states the DB "must mirror
-- these exactly," so this migration is the other half of that contract.
--
-- RLS is enabled on every table with NO POLICIES yet (Phase 7). This is deliberate: the
-- anon key is already live in the app since Phase 4, so enabling RLS now with nothing
-- granted fails closed (nothing but the service role can read/write) rather than leaving
-- a real database open until Phase 7 gets to it.

-- ============================================================================
-- Enum types
-- ============================================================================

create type user_role as enum ('admin', 'judge');
create type participant_category as enum ('kids', 'junior', 'senior');
create type stage_type as enum ('on_stage', 'off_stage');
create type gender as enum ('male', 'female');

-- Confirmed with the user at Phase 5 design time (was PROVISIONAL before this).
create type program_status as enum (
  'draft',
  'upcoming',
  'ongoing',
  'scoring',
  'completed',
  'published'
);

-- ============================================================================
-- Tables
-- ============================================================================

-- profiles: one row per Supabase Auth user. id IS the auth.users id (1:1), not an
-- independently generated key. No auto-provisioning trigger — every row is created
-- explicitly (the first admin is bootstrapped by hand; judges are created through the
-- Phase 11 Admin API route handler), since this app has no self-signup flow.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  role user_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table main_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- Nullable: Storage (Phase 9) comes after admin CRUD (Phase 8), so a group must be
  -- creatable before it has a photo.
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table students (
  id uuid primary key default gen_random_uuid(),
  roll_number text not null,
  name text not null,
  photo_url text,
  class text not null,
  gender gender not null,
  category participant_category not null,
  -- RESTRICT: deleting a house must not silently cascade-delete its students.
  group_id uuid not null references main_groups (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stage_type stage_type not null,
  category participant_category not null,
  status program_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table program_students (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs (id) on delete cascade,
  student_id uuid not null references students (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, student_id)
);

create table program_judges (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs (id) on delete cascade,
  judge_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, judge_id)
);

create table judge_scores (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs (id) on delete cascade,
  student_id uuid not null references students (id) on delete cascade,
  -- RESTRICT, not cascade: deleting a judge's account (a real admin feature) must never
  -- silently erase scoring history that already-published results depend on.
  judge_id uuid not null references profiles (id) on delete restrict,
  score smallint not null check (score between 0 and 100),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, student_id, judge_id)
);

-- points is an addition mandated by D-002 — architecture.md §11 defines results without
-- it, but the group_leaderboard view below sums results.points.
create table results (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs (id) on delete cascade,
  student_id uuid not null references students (id) on delete cascade,
  average_score numeric(5, 2) not null check (average_score between 0 and 100),
  position smallint not null check (position >= 1),
  -- Not constrained to {0,1,3,5}: project.md and src/constants/scoring.ts both note
  -- point values "should be configurable later," so the DB shouldn't hard-code today's
  -- defaults into a CHECK that a future settings module would have to migrate around.
  points smallint not null default 0 check (points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, student_id)
);

-- ============================================================================
-- Indexes
-- ============================================================================
-- Postgres auto-indexes primary keys and the leading column of each UNIQUE constraint
-- above (e.g. program_id in judge_scores). These cover columns that aren't already
-- covered by one of those.

create index students_group_id_idx on students (group_id);
create index students_category_idx on students (category);

create index programs_status_idx on programs (status);
create index programs_category_idx on programs (category);

create index program_students_student_id_idx on program_students (student_id);
create index program_judges_judge_id_idx on program_judges (judge_id);

create index judge_scores_student_id_idx on judge_scores (student_id);
create index judge_scores_judge_id_idx on judge_scores (judge_id);

-- Directly serves group_leaderboard's `results r on r.student_id = s.id` join below.
create index results_student_id_idx on results (student_id);

-- ============================================================================
-- updated_at trigger — every table gets one, or the column would silently lie
-- ============================================================================

create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger set_updated_at before update on main_groups
  for each row execute function set_updated_at();
create trigger set_updated_at before update on students
  for each row execute function set_updated_at();
create trigger set_updated_at before update on programs
  for each row execute function set_updated_at();
create trigger set_updated_at before update on program_students
  for each row execute function set_updated_at();
create trigger set_updated_at before update on program_judges
  for each row execute function set_updated_at();
create trigger set_updated_at before update on judge_scores
  for each row execute function set_updated_at();
create trigger set_updated_at before update on results
  for each row execute function set_updated_at();

-- ============================================================================
-- D-007: category matching enforced by the database, in addition to the UI and
-- Server Action validation. Additive hardening — a Server Action is a network
-- endpoint and can be called directly, bypassing any client-side check.
-- ============================================================================

create function enforce_student_program_category_match()
returns trigger
language plpgsql
as $$
declare
  v_student_category participant_category;
  v_program_category participant_category;
begin
  select category into v_student_category from students where id = new.student_id;
  select category into v_program_category from programs where id = new.program_id;

  if v_student_category is distinct from v_program_category then
    -- errcode 23514 = check_violation, so the app-side error handler (agents.md: never
    -- expose raw database errors) recognizes this the same way as any other CHECK
    -- failure and translates it to a readable message.
    raise exception 'category_mismatch: student category (%) does not match program category (%)',
      v_student_category, v_program_category
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger enforce_category_match
  before insert or update on program_students
  for each row execute function enforce_student_program_category_match();

-- ============================================================================
-- D-002: group leaderboard is a derived view, never a stored column.
--
-- security_invoker is an addition beyond D-002's literal SQL. Without it, a view runs
-- with its OWNER's privileges by default and silently bypasses RLS — exactly backwards
-- for the one query the anonymous audience actually needs. This is the view-level
-- equivalent of the D-007 trigger: additive hardening, not a change of design.
-- ============================================================================

create view group_leaderboard
with (security_invoker = true) as
select
  g.id,
  g.name,
  g.photo_url,
  coalesce(sum(r.points), 0) as total_points,
  rank() over (order by coalesce(sum(r.points), 0) desc) as rank
from main_groups g
left join students s on s.group_id = g.id
left join results r on r.student_id = s.id
group by g.id, g.name, g.photo_url;

-- ============================================================================
-- Row Level Security — enabled everywhere, zero policies yet (Phase 7 writes them).
-- ============================================================================

alter table profiles enable row level security;
alter table main_groups enable row level security;
alter table students enable row level security;
alter table programs enable row level security;
alter table program_students enable row level security;
alter table program_judges enable row level security;
alter table judge_scores enable row level security;
alter table results enable row level security;
