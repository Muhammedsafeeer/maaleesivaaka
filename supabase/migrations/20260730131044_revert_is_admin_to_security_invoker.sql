-- Reverts 20260730124858_is_admin_security_definer.sql now that the real root cause
-- of the Phase 9 upload bug is confirmed (20260730130453_storage_select_policies.sql
-- — storage.objects had no SELECT policy, so the implicit read-back after INSERT had
-- nothing granting it access). SECURITY DEFINER was a plausible theory tested along
-- the way, not the actual fix — the bug reproduced identically with it in place, and
-- was resolved by the SELECT policies alone. Restoring the Phase 7 original: these
-- functions are each self-referential (auth.uid()) and their own logic never depended
-- on elevated privilege, so DEFINER was carrying a real security-review cost (a
-- DEFINER function is always worth a second look) for no actual benefit — dead-end
-- debugging state, not a decision worth keeping.

create or replace function is_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function is_judge_assigned_to_program(p_program_id uuid)
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

create or replace function is_student_assigned_to_program(p_program_id uuid, p_student_id uuid)
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

create or replace function is_program_published(p_program_id uuid)
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
