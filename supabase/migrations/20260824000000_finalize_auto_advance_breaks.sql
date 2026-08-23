-- finalize_program_results' auto-advance (20260803010000_finalize_auto_advance.sql) only
-- ever looked at the `programs` table for "what starts next" — it predates fixture_breaks
-- entirely. Programs and breaks share one serial_number space per stage (see
-- 20260823040000_fixture_breaks.sql), so when a break sits right after the program that
-- just completed, this function skipped straight past it to the next upcoming PROGRAM,
-- leaving the break stuck on 'upcoming' forever. Fix: mirror fixture.service.ts's
-- startNextFixtureEntry() — pick whichever of the next upcoming program or next upcoming
-- break has the lower serial_number, and guard against either table already having a
-- current ('scoring') entry on that stage.

create or replace function finalize_program_results(p_program_id uuid, p_results jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stage_type stage_type;
  v_next_program_id uuid;
  v_next_program_serial int;
  v_next_break_id uuid;
  v_next_break_serial int;
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
  -- already on stage for that stage_type, across BOTH programs and breaks (a
  -- belt-and-suspenders check against a race with a concurrent admin override).
  if v_stage_type is not null
    and not exists (select 1 from programs where stage_type = v_stage_type and status = 'scoring')
    and not exists (select 1 from fixture_breaks where stage_type = v_stage_type and status = 'scoring')
  then
    select id, serial_number into v_next_program_id, v_next_program_serial
    from programs
    where stage_type = v_stage_type and status = 'upcoming' and serial_number is not null
    order by serial_number asc
    limit 1;

    select id, serial_number into v_next_break_id, v_next_break_serial
    from fixture_breaks
    where stage_type = v_stage_type and status = 'upcoming' and serial_number is not null
    order by serial_number asc
    limit 1;

    if v_next_break_id is not null
      and (v_next_program_id is null or v_next_break_serial <= v_next_program_serial)
    then
      update fixture_breaks set status = 'scoring' where id = v_next_break_id;
    elsif v_next_program_id is not null then
      update programs set status = 'scoring' where id = v_next_program_id;
    end if;
  end if;
end;
$$;

grant execute on function finalize_program_results(uuid, jsonb) to authenticated;
