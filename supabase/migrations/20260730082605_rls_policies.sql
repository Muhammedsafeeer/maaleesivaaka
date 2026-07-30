-- Phase 7: RLS policies for the remaining 7 tables (profiles already got its one
-- self-read policy in Phase 6). Matches docs/agents.md's "Row Level Security" section:
-- Admin full access, Judge read-assigned/write-own-scores, Audience read-published-only.
--
-- Two things confirmed with the user this phase — not settled by any doc:
-- 1. Anonymous audience can read program metadata (name/category/stage_type/status) at
--    ANY lifecycle stage, not just 'published' — D-003's concern is specifically about
--    RESULTS being seen too early, not the schedule itself; a live "now performing"
--    display needs this.
-- 2. Anonymous audience gets column-restricted access to students (id, group_id only —
--    no name/photo_url/roll_number/class/gender), just enough for the
--    group_leaderboard view's join to work. Full student PII is never public.

-- ============================================================================
-- Helper functions — reused across the policies below. Each is STABLE and
-- SECURITY INVOKER (the default): every one is self-referential (auth.uid()) or reads
-- rows the caller can already legitimately see, so none of them need to bypass RLS to
-- evaluate correctly. search_path is pinned per Postgres/Supabase security guidance for
-- functions referencing unqualified table names.
-- ============================================================================

create function is_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

create function is_judge_assigned_to_program(p_program_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from program_judges
    where program_id = p_program_id and judge_id = auth.uid()
  );
$$;

create function is_student_assigned_to_program(p_program_id uuid, p_student_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from program_students
    where program_id = p_program_id and student_id = p_student_id
  );
$$;

create function is_program_published(p_program_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from programs
    where id = p_program_id and status = 'published'
  );
$$;

grant execute on function is_admin() to anon, authenticated;
grant execute on function is_judge_assigned_to_program(uuid) to anon, authenticated;
grant execute on function is_student_assigned_to_program(uuid, uuid) to anon, authenticated;
grant execute on function is_program_published(uuid) to anon, authenticated;

-- ============================================================================
-- main_groups
-- ============================================================================

create policy "admin has full access to main_groups"
on main_groups
for all
to authenticated
using (is_admin())
with check (is_admin());

-- No judge policy: house affiliation is deliberately withheld from judges so scoring
-- can't be influenced by which house a student represents. No doc requires this either
-- way; it's a least-privilege default, easy to widen later if it turns out wrong.

create policy "anon can read main_groups"
on main_groups
for select
to anon
using (true);

-- ============================================================================
-- students
-- ============================================================================

create policy "admin has full access to students"
on students
for all
to authenticated
using (is_admin())
with check (is_admin());

create policy "judges can read students assigned to their programs"
on students
for select
to authenticated
using (
  exists (
    select 1 from program_students ps
    where ps.student_id = students.id
      and is_judge_assigned_to_program(ps.program_id)
  )
);

create policy "anon can read minimal student fields for the leaderboard"
on students
for select
to anon
using (true);

-- RLS policies decide which ROWS are visible; column exposure is a separate GRANT.
-- anon's default table-wide SELECT (set up automatically for every public table) is
-- narrowed here to only the two columns the group_leaderboard view's join needs — name,
-- photo_url, roll_number, class, and gender are never exposed to anon.
revoke select on students from anon;
grant select (id, group_id) on students to anon;

-- ============================================================================
-- programs
-- ============================================================================

create policy "admin has full access to programs"
on programs
for all
to authenticated
using (is_admin())
with check (is_admin());

create policy "judges can read their assigned programs"
on programs
for select
to authenticated
using (is_judge_assigned_to_program(id));

-- Confirmed with the user: every status is anon-visible, not just 'published'.
create policy "anon can read all programs"
on programs
for select
to anon
using (true);

-- ============================================================================
-- program_students
-- ============================================================================

create policy "admin has full access to program_students"
on program_students
for all
to authenticated
using (is_admin())
with check (is_admin());

create policy "judges can read program_students for their assigned programs"
on program_students
for select
to authenticated
using (is_judge_assigned_to_program(program_id));

-- No anon policy: the leaderboard view never queries this table, and no documented
-- public-facing feature needs it.

-- ============================================================================
-- program_judges
-- ============================================================================

create policy "admin has full access to program_judges"
on program_judges
for all
to authenticated
using (is_admin())
with check (is_admin());

create policy "judges can read their own assignment rows"
on program_judges
for select
to authenticated
using (judge_id = auth.uid());

-- ============================================================================
-- judge_scores
-- ============================================================================

create policy "admin has full access to judge_scores"
on judge_scores
for all
to authenticated
using (is_admin())
with check (is_admin());

-- Judges see only their OWN submitted scores — never a colleague's, even for the same
-- student in the same program. Independent judging depends on this: seeing another
-- judge's score before submitting your own would bias the result.
create policy "judges can read their own scores"
on judge_scores
for select
to authenticated
using (judge_id = auth.uid());

-- Re-verifies the same assignment invariants the UI/Server Action already check —
-- additive hardening, same pattern as D-007's category-match trigger.
create policy "judges can submit scores for their assigned programs"
on judge_scores
for insert
to authenticated
with check (
  judge_id = auth.uid()
  and is_judge_assigned_to_program(program_id)
  and is_student_assigned_to_program(program_id, student_id)
);

create policy "judges can update their own scores"
on judge_scores
for update
to authenticated
using (judge_id = auth.uid())
with check (
  judge_id = auth.uid()
  and is_judge_assigned_to_program(program_id)
  and is_student_assigned_to_program(program_id, student_id)
);

-- No anon policy: raw scores are never public, at any program status — only the
-- calculated, published results table is.

-- ============================================================================
-- results
-- ============================================================================

create policy "admin has full access to results"
on results
for all
to authenticated
using (is_admin())
with check (is_admin());

-- No judge policy: architecture.md §9 grants judges read access to their own raw
-- scores only (above), not to calculated/ranked results.

create policy "anon can read results for published programs"
on results
for select
to anon
using (is_program_published(program_id));
