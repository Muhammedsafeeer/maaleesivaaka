-- Admin-requested: finalize_program_results' tie check (20260819050000) currently
-- blocks the scoring -> completed transition whenever two or more results rows share a
-- position, with no regard for what that shared score actually is. That's the right
-- call for a genuine tie (several students competitively landing on the same real
-- score), but a shared average_score of exactly 0 usually isn't a competitive tie at
-- all — it's what a batch of never-actually-scored students all get once nulls are
-- filled with 0 (see the scoring-form change that makes 0 the floor for an untouched
-- input). A pile of 0-scored students all "tying" for last place shouldn't block a
-- program from completing the way a real 95/95 tie for 1st should.
--
-- Byte-for-byte the 20260819050000 version otherwise — only the tie-detection query's
-- WHERE clause changes (excludes average_score = 0 rows before grouping).

create or replace function finalize_program_results(p_program_id uuid, p_results jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_participation_type participation_type;
  v_has_tie boolean;
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

  if not v_has_tie then
    update programs
    set status = 'completed'
    where id = p_program_id and status = 'scoring';
  end if;
end;
$$;
