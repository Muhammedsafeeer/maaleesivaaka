-- D-025 follow-up: team-based scoring for group programs.
--
-- Context: D-025 (group programs, chest numbers) deliberately scoped scoring/results to
-- stay per-student, calling it out as "a separate, materially bigger piece of work if
-- ever wanted." With real group programs now live, that gap surfaced as a real problem:
-- judges saw every team member as an anonymous individual row with no team grouping,
-- teammates who performed together could get different scores/ranks from each other,
-- and group_leaderboard (which sums results.points per student joined to house) scaled
-- a team's points by team size instead of awarding them once per team win.
--
-- Fix: judge_scores and results gain a `group_entry_id` alternative to `student_id`,
-- exactly one of which is ever set on a row. A group program is scored ONCE per team
-- (program_group_entries row), not once per member — individual programs are entirely
-- unaffected, every individual-program code path below is byte-for-byte the same logic
-- it already had.

-- ============================================================================
-- Schema: judge_scores and results both gain group_entry_id as an alternative to
-- student_id. Postgres never treats NULLs as duplicates in a unique constraint, so the
-- existing unique(program_id, student_id, judge_id) / unique(program_id, student_id)
-- constraints stay valid unmodified — every group row simply has student_id = null and
-- can never collide with them.
-- ============================================================================

alter table judge_scores alter column student_id drop not null;
alter table judge_scores
  add column group_entry_id uuid references program_group_entries (id) on delete cascade;
alter table judge_scores
  add constraint judge_scores_target_check check (
    (student_id is not null and group_entry_id is null) or
    (student_id is null and group_entry_id is not null)
  );
alter table judge_scores
  add constraint judge_scores_group_entry_judge_unique unique (program_id, group_entry_id, judge_id);
create index judge_scores_group_entry_id_idx on judge_scores (group_entry_id);

alter table results alter column student_id drop not null;
alter table results
  add column group_entry_id uuid references program_group_entries (id) on delete cascade;
alter table results
  add constraint results_target_check check (
    (student_id is not null and group_entry_id is null) or
    (student_id is null and group_entry_id is not null)
  );
alter table results
  add constraint results_group_entry_unique unique (program_id, group_entry_id);
create index results_group_entry_id_idx on results (group_entry_id);

-- Mirrors is_student_assigned_to_program (Phase 7), for the judge_scores RLS policies
-- below — a group row's insert/update needs the equivalent check against
-- program_group_entries instead of program_students.
create function is_group_entry_assigned_to_program(p_program_id uuid, p_group_entry_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from program_group_entries
    where id = p_group_entry_id and program_id = p_program_id
  );
$$;

grant execute on function is_group_entry_assigned_to_program(uuid, uuid) to authenticated;

-- ============================================================================
-- RLS: only judge_scores' insert/update policies reference student_id directly (see
-- 20260730082605_rls_policies.sql) — everything else (admin full-access, judges'
-- own-scores read, results' admin/anon-published policies) is unaffected.
-- ============================================================================

drop policy "judges can submit scores for their assigned programs" on judge_scores;
create policy "judges can submit scores for their assigned programs"
on judge_scores
for insert
to authenticated
with check (
  judge_id = auth.uid()
  and is_judge_assigned_to_program(program_id)
  and (
    (student_id is not null and is_student_assigned_to_program(program_id, student_id))
    or (group_entry_id is not null and is_group_entry_assigned_to_program(program_id, group_entry_id))
  )
);

drop policy "judges can update their own scores" on judge_scores;
create policy "judges can update their own scores"
on judge_scores
for update
to authenticated
using (judge_id = auth.uid())
with check (
  judge_id = auth.uid()
  and is_judge_assigned_to_program(program_id)
  and (
    (student_id is not null and is_student_assigned_to_program(program_id, student_id))
    or (group_entry_id is not null and is_group_entry_assigned_to_program(program_id, group_entry_id))
  )
);

-- ============================================================================
-- is_program_fully_scored: branch target counts on participation_type. The individual
-- branch is the exact same three counts/equality the function already had.
-- ============================================================================

create or replace function is_program_fully_scored(p_program_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_participation_type participation_type;
  v_judge_count int;
  v_target_count int;
  v_score_count int;
begin
  select participation_type into v_participation_type from programs where id = p_program_id;
  select count(*) into v_judge_count from program_judges where program_id = p_program_id;

  if v_participation_type = 'group' then
    select count(*) into v_target_count from program_group_entries where program_id = p_program_id;
    select count(*) into v_score_count
      from judge_scores where program_id = p_program_id and group_entry_id is not null;
  else
    select count(*) into v_target_count from program_students where program_id = p_program_id;
    select count(*) into v_score_count
      from judge_scores where program_id = p_program_id and student_id is not null;
  end if;

  return v_judge_count > 0 and v_target_count > 0 and v_score_count = v_judge_count * v_target_count;
end;
$$;

-- ============================================================================
-- get_program_scores: a program's judge_scores rows are homogeneous (all student-keyed
-- or all group_entry-keyed), so no branching is needed here — just widen the returned
-- shape to carry both possible keys, exactly one of which will be non-null per row.
-- ============================================================================

drop function if exists get_program_scores(uuid);

create function get_program_scores(p_program_id uuid)
returns table(student_id uuid, group_entry_id uuid, score smallint, criteria_scores jsonb)
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
  select js.student_id, js.group_entry_id, js.score, js.criteria_scores
  from judge_scores js
  where js.program_id = p_program_id;
end;
$$;

grant execute on function get_program_scores(uuid) to authenticated;

-- ============================================================================
-- finalize_program_results: DOES need to branch — a single INSERT ... ON CONFLICT can
-- only target one arbiter constraint, and student-keyed vs. group-keyed rows conflict
-- on different unique constraints. The individual (else) branch is byte-for-byte the
-- function's prior logic: same columns, same conflict target, same SET clause.
-- ============================================================================

create or replace function finalize_program_results(p_program_id uuid, p_results jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_participation_type participation_type;
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

  update programs
  set status = 'completed'
  where id = p_program_id and status = 'scoring';
end;
$$;

-- ============================================================================
-- group_leaderboard (D-002): sum a house's points once per (program, team) for group
-- programs and once per (program, student) for individual programs — never joined
-- through program_students per team member, or a team's points would scale with team
-- size again. security_invoker so an anon caller stays scoped by results/
-- program_group_entries/students' own RLS, same as before.
-- ============================================================================

create or replace view group_leaderboard
with (security_invoker = true) as
with points as (
  -- Individual-program results: reach the house through the scored student.
  select s.group_id, r.points
  from results r
  join students s on s.id = r.student_id
  where r.student_id is not null

  union all

  -- Group-program results: one row per team entry already IS one row per house — summed
  -- directly, never joined through students/program_students.
  select pge.group_id, r.points
  from results r
  join program_group_entries pge on pge.id = r.group_entry_id
  where r.group_entry_id is not null
)
select
  g.id,
  g.name,
  g.photo_url,
  coalesce(sum(p.points), 0) as total_points,
  rank() over (order by coalesce(sum(p.points), 0) desc) as rank
from main_groups g
left join points p on p.group_id = g.id
group by g.id, g.name, g.photo_url;

-- ============================================================================
-- Flutter companion app parity (program_management_app): submit_judge_scores is a full
-- independent port of scoring.service.ts's submitScores(), so it needs the same
-- group_entry_id branch or it would silently keep scoring group programs per-student.
-- p_scores entries now carry EITHER student_id OR group_entry_id (never both), same
-- shape as the web app's ScoreInput/TeamScoreInput.
-- ============================================================================

create or replace function submit_judge_scores(
  p_program_id uuid,
  p_scores jsonb,
  p_admin_password text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_judge_id uuid := auth.uid();
  v_status text;
  v_criterion_ids uuid[];
  v_criterion_count int;
  v_changes_existing boolean := false;
  v_admin_verified boolean := false;
  v_entry jsonb;
  v_student_id uuid;
  v_group_entry_id uuid;
  v_score int;
  v_criteria jsonb;
  v_existing_score int;
begin
  if v_judge_id is null then
    raise exception 'You must be signed in to submit scores.' using errcode = '42501';
  end if;

  if not is_judge_assigned_to_program(p_program_id) then
    raise exception 'You are not assigned to this program.' using errcode = '42501';
  end if;

  if jsonb_array_length(p_scores) = 0 then
    raise exception 'Enter at least one score before saving.';
  end if;

  select status into v_status from programs where id = p_program_id;
  if v_status is null or v_status is distinct from 'scoring' then
    raise exception 'Scoring isn''t open for this program right now.';
  end if;

  select array_agg(id), count(*) into v_criterion_ids, v_criterion_count
  from scoring_criteria where program_id = p_program_id;

  -- Pass 1: validate every entry and detect whether this submission would change a
  -- score already saved by this judge for this program — determined fresh from the DB.
  for v_entry in select * from jsonb_array_elements(p_scores)
  loop
    v_student_id := nullif(v_entry->>'student_id', '')::uuid;
    v_group_entry_id := nullif(v_entry->>'group_entry_id', '')::uuid;
    v_criteria := coalesce(v_entry->'criteria_scores', '[]'::jsonb);

    if v_criterion_count > 0 then
      if jsonb_array_length(v_criteria) <> v_criterion_count
        or exists (
          select 1 from jsonb_array_elements(v_criteria) c
          where not ((c->>'criterion_id')::uuid = any(v_criterion_ids))
        )
      then
        raise exception 'Scoring types have changed — please refresh and try again.';
      end if;
      select coalesce(sum((c->>'score')::int), 0) into v_score
      from jsonb_array_elements(v_criteria) c;
    else
      v_score := (v_entry->>'score')::int;
    end if;

    if v_score is null or v_score < 0 then
      raise exception 'Enter a valid score for every entry.';
    end if;

    if v_group_entry_id is not null then
      select score into v_existing_score
      from judge_scores
      where program_id = p_program_id and group_entry_id = v_group_entry_id and judge_id = v_judge_id;
    else
      select score into v_existing_score
      from judge_scores
      where program_id = p_program_id and student_id = v_student_id and judge_id = v_judge_id;
    end if;

    if v_existing_score is not null and v_existing_score is distinct from v_score then
      v_changes_existing := true;
    end if;
  end loop;

  if v_changes_existing then
    if p_admin_password is null or p_admin_password = '' then
      raise exception 'ADMIN_OVERRIDE_REQUIRED';
    end if;

    select exists (
      select 1
      from auth.users u
      join profiles p on p.id = u.id
      where p.role = 'admin'
        and u.encrypted_password is not null
        and u.encrypted_password = extensions.crypt(p_admin_password, u.encrypted_password)
    ) into v_admin_verified;

    if not v_admin_verified then
      raise exception 'ADMIN_OVERRIDE_REQUIRED';
    end if;
  end if;

  -- Pass 2: upsert. One statement per row (plpgsql has no equivalent of supabase-js's
  -- single batched .upsert() call) — same conflict targets as the web app's RPCs above.
  for v_entry in select * from jsonb_array_elements(p_scores)
  loop
    v_student_id := nullif(v_entry->>'student_id', '')::uuid;
    v_group_entry_id := nullif(v_entry->>'group_entry_id', '')::uuid;
    v_criteria := coalesce(v_entry->'criteria_scores', '[]'::jsonb);

    if v_criterion_count > 0 then
      select coalesce(sum((c->>'score')::int), 0) into v_score
      from jsonb_array_elements(v_criteria) c;
    else
      v_score := (v_entry->>'score')::int;
      v_criteria := '[]'::jsonb;
    end if;

    if v_group_entry_id is not null then
      insert into judge_scores (program_id, group_entry_id, judge_id, score, criteria_scores)
      values (p_program_id, v_group_entry_id, v_judge_id, v_score, v_criteria)
      on conflict (program_id, group_entry_id, judge_id) do update set
        score = excluded.score,
        criteria_scores = excluded.criteria_scores,
        updated_at = now();
    else
      insert into judge_scores (program_id, student_id, judge_id, score, criteria_scores)
      values (p_program_id, v_student_id, v_judge_id, v_score, v_criteria)
      on conflict (program_id, student_id, judge_id) do update set
        score = excluded.score,
        criteria_scores = excluded.criteria_scores,
        updated_at = now();
    end if;
  end loop;
end;
$$;

grant execute on function submit_judge_scores(uuid, jsonb, text) to authenticated;
