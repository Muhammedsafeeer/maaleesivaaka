-- Two admin-requested features:
--
-- 1. Per-program "hide results from the public" toggle (admin/judges are unaffected;
--    only anonymous audience-facing reads are gated). Piggybacks on the existing
--    is_program_published() helper — every anon-facing read already goes through it
--    (directly via RLS, or indirectly via group_leaderboard's security_invoker view),
--    so extending that one function propagates everywhere automatically, except
--    search_student_results, which has its own independent status check and needs its
--    own update.
--
-- 2. Judges are alerted to a tie (two+ participants landing on the same position) in
--    their own program, and results stay unpublished until an admin decides — accept
--    the tie as-is (D-004's original behavior still applies once accepted: shared
--    position, both get full points) or have the judge revise a score. This is a
--    change to D-003's auto-finalize pipeline: finalize_program_results now skips the
--    scoring -> completed transition when the results it just wrote contain a tie,
--    leaving the program at 'scoring' (which already naturally blocks Publish, since
--    publishProgram/the UI both gate on status = 'completed'). Ties are never stored as
--    a separate flag — always derived from `results` itself (duplicate `position` per
--    program), consistent with D-002's "never store what can be derived" precedent.
--    Judges need a new, narrow read grant on `results` to see the tie at all — they
--    previously had none (architecture.md §9: judges see only their own raw scores).

-- ============================================================================
-- 1a. hide_results column + is_program_published() extended to check it.
-- ============================================================================

alter table programs add column hide_results boolean not null default false;

create or replace function is_program_published(p_program_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from programs
    where id = p_program_id and status = 'published' and not hide_results
  );
$$;

-- ============================================================================
-- 1b. search_student_results has its own independent status check (SECURITY DEFINER,
-- doesn't route through is_program_published) — needs the same condition added.
-- ============================================================================

create or replace function search_student_results(p_query text)
returns table (
  student_id uuid,
  student_name text,
  program_name text,
  program_category participant_category,
  result_position smallint,
  points smallint,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_query text := trim(p_query);
  v_matched_ids uuid[];
begin
  if v_query is null or length(v_query) < 3 then
    return;
  end if;

  select array_agg(matched.id) into v_matched_ids
  from (
    select id from students
    where roll_number = v_query or name ilike '%' || v_query || '%'
    order by name
    limit 5
  ) matched;

  if v_matched_ids is null then
    return;
  end if;

  return query
  select
    s.id,
    s.name,
    p.name,
    p.category,
    r.position,
    r.points,
    r.updated_at
  from results r
  join students s on s.id = r.student_id
  join programs p on p.id = r.program_id
  where s.id = any(v_matched_ids)
    and p.status = 'published'
    and not p.hide_results
  order by s.name, r.updated_at desc;
end;
$$;

-- ============================================================================
-- 2a. finalize_program_results: skip the scoring -> completed transition when the
-- results just written contain a tie (two+ rows sharing a position). Everything else
-- is byte-for-byte the version from 20260819020000 — same participation_type branch,
-- same upserts.
-- ============================================================================

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
    where program_id = p_program_id
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

-- ============================================================================
-- 2b. Judges can now read results (position/points, not raw per-judge scores) for
-- their own assigned programs — needed so a judge can see they're blocked on a tie at
-- all. Narrow: still nothing for a program they're not assigned to, and this is the
-- computed/ranked output, not a colleague's individual input score (the thing D-014
-- was actually protecting).
-- ============================================================================

create policy "judges can read results for their assigned programs"
on results
for select
to authenticated
using (is_judge_assigned_to_program(program_id));
