-- Per-program configurable scoring rubric. Previously every judge submitted a single
-- total 0-100 (see the old judge_scores.score check). Now an admin can define named
-- scoring types per program (e.g. "Voice", "Performance", "Attitude"), each judged
-- 0-10 by every judge; the total is their sum. A program with no configured types keeps
-- a single implicit score out of 10 (not 100) — enforced app-side, not in the DB, since
-- there's no criteria row to check against in that case.

-- ============================================================================
-- scoring_criteria: the named scoring types for a program, admin-managed.
-- ============================================================================

create table scoring_criteria (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs (id) on delete cascade,
  name text not null,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, name)
);

create index scoring_criteria_program_id_idx on scoring_criteria (program_id);

create trigger set_updated_at before update on scoring_criteria
  for each row execute function set_updated_at();

alter table scoring_criteria enable row level security;

create policy "admin has full access to scoring_criteria"
on scoring_criteria
for all
to authenticated
using (is_admin())
with check (is_admin());

-- Judges need to read a program's scoring types to render the scoring form, same
-- reasoning as programs' own judge-read policy.
create policy "judges can read scoring_criteria for assigned programs"
on scoring_criteria
for select
to authenticated
using (is_judge_assigned_to_program(program_id));

-- ============================================================================
-- judge_scores: score stays the authoritative total (unchanged downstream), plus a
-- breakdown for programs that have scoring types. Empty array for the single-score
-- case — no synthetic criterion row is ever persisted.
-- ============================================================================

alter table judge_scores add column criteria_scores jsonb not null default '[]'::jsonb;

-- The total's upper bound now depends on how many scoring types the program has
-- (criteria_count * 10, or 10 with none) instead of a fixed 100 — same reasoning
-- already documented on results.points: don't hard-code today's bound into a CHECK
-- that a variable, admin-configurable rubric would have to migrate around.
alter table judge_scores drop constraint if exists judge_scores_score_check;
alter table judge_scores add constraint judge_scores_score_check check (score >= 0);

-- ============================================================================
-- results: per-criterion average across judges, written once at finalize time
-- alongside average_score/position/points.
-- ============================================================================

alter table results add column criteria_averages jsonb not null default '[]'::jsonb;

-- ============================================================================
-- RPC updates: get_program_scores also returns the breakdown so the TypeScript
-- averaging layer (D-004) can average per criterion, not just the total.
-- finalize_program_results writes the per-criterion averages it's handed alongside
-- the existing columns. Same signatures/grants as Phase 13 — no new privilege surface.
-- ============================================================================

-- CREATE OR REPLACE can't change a function's return columns (OUT parameters) — this
-- one gains criteria_scores, so the old signature has to be dropped first.
drop function if exists get_program_scores(uuid);

create function get_program_scores(p_program_id uuid)
returns table(student_id uuid, score smallint, criteria_scores jsonb)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not (is_admin() or is_judge_assigned_to_program(p_program_id)) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return query
  select js.student_id, js.score, js.criteria_scores
  from judge_scores js
  where js.program_id = p_program_id;
end;
$$;

grant execute on function get_program_scores(uuid) to authenticated;

create or replace function finalize_program_results(p_program_id uuid, p_results jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (is_admin() or is_judge_assigned_to_program(p_program_id)) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  insert into results (program_id, student_id, average_score, position, points, criteria_averages)
  select
    p_program_id,
    (r->>'student_id')::uuid,
    (r->>'average_score')::numeric,
    (r->>'position')::smallint,
    (r->>'points')::smallint,
    coalesce(r->'criteria_averages', '[]'::jsonb)
  from jsonb_array_elements(p_results) as r
  on conflict (program_id, student_id) do update set
    average_score = excluded.average_score,
    position = excluded.position,
    points = excluded.points,
    criteria_averages = excluded.criteria_averages,
    updated_at = now();

  update programs
  set status = 'completed'
  where id = p_program_id and status = 'scoring';
end;
$$;
