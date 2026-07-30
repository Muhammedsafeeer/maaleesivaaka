-- Phase 13: automatic result finalization (D-003), via three narrow SECURITY DEFINER
-- functions (D-014). See docs/decisions.md D-014 for the full rationale — short version:
-- a judge's own RLS-scoped session cannot see other judges' scores or write to
-- results/programs, so the "has everyone finished? if so, calculate and write" flow
-- needs a deliberately narrow privilege escalation. The averaging/ranking math itself
-- stays a pure TypeScript function (scoring.service.ts, per D-004) — these functions
-- only do the parts TypeScript structurally cannot: cross-judge reads and privileged
-- writes.

-- ============================================================================
-- is_program_fully_scored: every assigned judge has scored every assigned student.
-- No authorization gate — leaks no row data, same privacy profile as
-- is_program_published() (Phase 7).
-- ============================================================================

create function is_program_fully_scored(p_program_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from program_judges where program_id = p_program_id) > 0
    and (select count(*) from program_students where program_id = p_program_id) > 0
    and (
      select count(*) from judge_scores where program_id = p_program_id
    ) = (
      (select count(*) from program_judges where program_id = p_program_id)
      * (select count(*) from program_students where program_id = p_program_id)
    );
$$;

grant execute on function is_program_fully_scored(uuid) to authenticated;

-- ============================================================================
-- get_program_scores: raw (student_id, score) rows across EVERY judge, for the
-- TypeScript averaging/ranking layer. Gated — unlike the boolean check above, this
-- exposes real row data.
-- ============================================================================

create function get_program_scores(p_program_id uuid)
returns table(student_id uuid, score smallint)
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
  select js.student_id, js.score from judge_scores js where js.program_id = p_program_id;
end;
$$;

grant execute on function get_program_scores(uuid) to authenticated;

-- ============================================================================
-- finalize_program_results: writes already-ranked rows (computed in TypeScript) and
-- flips the program to 'completed'. Idempotent — safe to call more than once for the
-- same program (upsert on the results unique constraint; status transition guarded by
-- `where status = 'scoring'` so it never clobbers a status an admin already changed).
-- ============================================================================

create function finalize_program_results(p_program_id uuid, p_results jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (is_admin() or is_judge_assigned_to_program(p_program_id)) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  insert into results (program_id, student_id, average_score, position, points)
  select
    p_program_id,
    (r->>'student_id')::uuid,
    (r->>'average_score')::numeric,
    (r->>'position')::smallint,
    (r->>'points')::smallint
  from jsonb_array_elements(p_results) as r
  on conflict (program_id, student_id) do update set
    average_score = excluded.average_score,
    position = excluded.position,
    points = excluded.points,
    updated_at = now();

  update programs
  set status = 'completed'
  where id = p_program_id and status = 'scoring';
end;
$$;

grant execute on function finalize_program_results(uuid, jsonb) to authenticated;
