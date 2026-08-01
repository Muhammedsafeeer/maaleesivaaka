-- Fixes a real bug in the "auto-start the next program on completion" feature added in
-- application code: it called fixture.service.ts's startNextProgram(), a plain
-- RLS-scoped client update on `programs`. That works fine when an admin triggers it
-- (overrideProgramStatus, admin has full RLS access) but finalize_program_results is
-- most commonly invoked by a JUDGE's own session right after their submission
-- completes scoring — and judges only have a SELECT policy on `programs`, never
-- UPDATE, so that plain update silently failed under RLS every time a judge (not an
-- admin) was the one who completed the program.
--
-- Fix: do the auto-advance here instead, inside this already-SECURITY-DEFINER
-- function, which already runs with the privilege to write `programs` regardless of
-- who's calling it. The application-code call in result.service.ts's
-- finalizeIfComplete is removed in this same change (see that file).

create or replace function finalize_program_results(p_program_id uuid, p_results jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stage_type stage_type;
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
  where id = p_program_id and status = 'scoring'
  returning stage_type into v_stage_type;

  -- Only when THIS call is what actually completed the program — v_stage_type is left
  -- null by a repeat/idempotent call (the WHERE above then matches nothing, same as
  -- the function's existing idempotency guarantee) — and only when nothing else is
  -- already on stage for that stage_type (belt-and-suspenders against a race with a
  -- concurrent admin override; startNextProgram uses the same two guards).
  if v_stage_type is not null then
    update programs
    set status = 'scoring'
    where id = (
      select id from programs
      where stage_type = v_stage_type
        and status = 'upcoming'
        and serial_number is not null
      order by serial_number asc
      limit 1
    )
    and not exists (
      select 1 from programs where stage_type = v_stage_type and status = 'scoring'
    );
  end if;
end;
$$;

grant execute on function finalize_program_results(uuid, jsonb) to authenticated;
