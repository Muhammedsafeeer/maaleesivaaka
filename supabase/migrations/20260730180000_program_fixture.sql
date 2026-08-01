-- Phase 17: program fixture (running order) support.
--
-- Adds a per-stage running-order number to programs, and teaches the existing
-- finalize_program_results() (Phase 13, D-014) to auto-advance the next program
-- in serial order to 'scoring' the moment the current one finishes scoring —
-- same SECURITY DEFINER function, same callers, no new privilege surface.

alter table programs add column serial_number integer;

create index programs_stage_type_serial_number_idx on programs (stage_type, serial_number);

create or replace function finalize_program_results(p_program_id uuid, p_results jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stage_type stage_type;
  v_serial_number integer;
  v_next_program_id uuid;
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
  where id = p_program_id and status = 'scoring'
  returning stage_type, serial_number into v_stage_type, v_serial_number;

  -- Auto-advance: only possible if this program actually had a serial number
  -- (i.e. it was scheduled on the fixture page) and a next-in-line 'upcoming'
  -- program exists for the same stage.
  if v_stage_type is not null and v_serial_number is not null then
    select p.id into v_next_program_id
    from programs p
    where p.stage_type = v_stage_type
      and p.status = 'upcoming'
      and p.serial_number is not null
      and p.serial_number > v_serial_number
    order by p.serial_number asc
    limit 1;

    if v_next_program_id is not null then
      update programs set status = 'scoring' where id = v_next_program_id;
    end if;
  end if;
end;
$$;
