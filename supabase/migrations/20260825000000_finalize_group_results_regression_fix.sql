-- Bug fix: 20260824000000_finalize_auto_advance_breaks.sql's `create or replace
-- function finalize_program_results` was authored from the 20260803010000 copy (the
-- last version before group-program scoring existed) instead of the actual latest
-- version (20260823000000_ignore_zero_score_ties.sql). That silently reverted two
-- pieces of logic while adding the break auto-advance feature:
--
-- 1. The participation_type branch (20260819020000/D-025 follow-up) that inserts
--    group-program results keyed by group_entry_id. Losing it means a GROUP program's
--    finalize call only ever inserted `student_id`, which is null for every row of a
--    group program's results payload — group_entry_id was never in the column list
--    either, so every row violated `results_target_check` (exactly one of
--    student_id/group_entry_id must be non-null). The insert raised, the whole function
--    aborted, and the program never left 'scoring' — reported as "program not
--    completing after scoring" for team/group programs (e.g. a group devotional-song
--    program like Muhiyudheen Maala).
-- 2. The zero-tie check (20260823000000) that withholds the scoring -> completed flip
--    while two or more non-zero results share a position.
--
-- This version is the union: 20260823000000's body (group branch + tie check) plus
-- 20260824000000's break-aware auto-advance, unchanged.

create or replace function finalize_program_results(p_program_id uuid, p_results jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_participation_type participation_type;
  v_has_tie boolean;
  v_stage_type stage_type;
  v_next_program_id uuid;
  v_next_program_serial int;
  v_next_break_id uuid;
  v_next_break_serial int;
begin
  if not (is_admin() or is_judge_assigned_to_program(p_program_id)) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select participation_type into v_participation_type from programs where id = p_program_id;

  if v_participation_type = 'group' then
    insert into results (program_id, group_entry_id, average_score, position, points, criteria_averages)
    select
      p_program_id,
      (r->>'group_entry_id')::uuid,
      (r->>'average_score')::numeric,
      (r->>'position')::smallint,
      (r->>'points')::smallint,
      coalesce(r->'criteria_averages', '[]'::jsonb)
    from jsonb_array_elements(p_results) as r
    on conflict (program_id, group_entry_id) do update set
      average_score = excluded.average_score,
      position = excluded.position,
      points = excluded.points,
      criteria_averages = excluded.criteria_averages,
      updated_at = now();
  else
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
  end if;

  select exists (
    select 1 from results
    where program_id = p_program_id and average_score <> 0
    group by position
    having count(*) > 1
  ) into v_has_tie;

  if v_has_tie then
    return;
  end if;

  update programs
  set status = 'completed'
  where id = p_program_id and status = 'scoring'
  returning stage_type into v_stage_type;

  -- Only when THIS call is what actually completed the program — v_stage_type is left
  -- null by a repeat/idempotent call — and only when nothing else is already on stage
  -- for that stage_type, across BOTH programs and breaks.
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
