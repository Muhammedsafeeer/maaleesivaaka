-- Audience "Find My Result" search (D-019, docs/decisions.md): a narrow, lookup-only
-- exception to D-017's house-only contract, distinct from D-018's Latest Winner podium.
-- The caller must already know the student's own roll number or (close to) full name —
-- there is no way to browse or list students through this function, only to look one
-- up. SECURITY DEFINER so it can match against students.roll_number without granting
-- that column to anon at all (roll_number is never SELECTed directly by anon anywhere
-- else, and is never included in this function's return columns either — it's used only
-- as a private matching key, never echoed back).
--
-- Guards against casual enumeration: a minimum 3-character query, and at most 5 matched
-- students per call. This does not make brute-forcing impossible (a scripted caller can
-- still call the function many times with different inputs — there's no rate limiting
-- in this app at any layer), only impractical for a human using the search box as
-- intended. Only published programs' results are ever returned.

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
  order by s.name, r.updated_at desc;
end;
$$;

grant execute on function search_student_results(text) to anon, authenticated;
