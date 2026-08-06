-- Flutter companion app (../program_management_app): unlike the Next.js app, there's
-- no trusted server layer to hold the service-role key that
-- src/lib/services/auth.service.ts's verifyAdminPassword() currently uses to check an
-- admin-override password. This RPC ports src/lib/services/scoring.service.ts's
-- submitScores() in full — including that check — so both apps share one
-- implementation (per program_management_app/README.md's porting notes) instead of
-- the Flutter app either duplicating weaker logic or a client being able to forge
-- "override verified". The password itself travels once, straight into this
-- SECURITY DEFINER function's parameters, and is checked against auth.users'
-- bcrypt hash via pgcrypto — never against a service-role-fetched email list, and
-- never persisted. Same exposure profile as the existing web flow (which also sends
-- the raw password to a server action over TLS), just re-homed to Postgres so it
-- isn't Next.js-specific.
--
-- p_scores shape: jsonb array of {student_id: uuid, score: int, criteria_scores?:
-- [{criterion_id: uuid, score: int}]} — same as scoring.service.ts's ScoreInput.

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

  -- Not modeled in RLS (only checks assignment, not lifecycle stage) — app-level
  -- re-check, same as scoring.service.ts's own comment on this.
  select status into v_status from programs where id = p_program_id;
  if v_status is null or v_status is distinct from 'scoring' then
    raise exception 'Scoring isn''t open for this program right now.';
  end if;

  select array_agg(id), count(*) into v_criterion_ids, v_criterion_count
  from scoring_criteria where program_id = p_program_id;

  -- Pass 1: validate every entry and detect whether this submission would change a
  -- score already saved by this judge for this program — determined fresh from the
  -- DB, never from anything the client asserts.
  for v_entry in select * from jsonb_array_elements(p_scores)
  loop
    v_student_id := (v_entry->>'student_id')::uuid;
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
      raise exception 'Enter a valid score for every student.';
    end if;

    select score into v_existing_score
    from judge_scores
    where program_id = p_program_id and student_id = v_student_id and judge_id = v_judge_id;

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

  -- Pass 2: upsert. Same (program_id, student_id, judge_id) unique constraint as the
  -- web app's bulk upsert — one statement per row here since plpgsql has no
  -- equivalent of supabase-js's single batched .upsert() call, but it's the same
  -- final state.
  for v_entry in select * from jsonb_array_elements(p_scores)
  loop
    v_student_id := (v_entry->>'student_id')::uuid;
    v_criteria := coalesce(v_entry->'criteria_scores', '[]'::jsonb);

    if v_criterion_count > 0 then
      select coalesce(sum((c->>'score')::int), 0) into v_score
      from jsonb_array_elements(v_criteria) c;
    else
      v_score := (v_entry->>'score')::int;
      v_criteria := '[]'::jsonb;
    end if;

    insert into judge_scores (program_id, student_id, judge_id, score, criteria_scores)
    values (p_program_id, v_student_id, v_judge_id, v_score, v_criteria)
    on conflict (program_id, student_id, judge_id) do update set
      score = excluded.score,
      criteria_scores = excluded.criteria_scores,
      updated_at = now();
  end loop;
end;
$$;

grant execute on function submit_judge_scores(uuid, jsonb, text) to authenticated;
