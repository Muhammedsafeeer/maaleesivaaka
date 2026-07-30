-- Fix for a real bug found live in Phase 9: uploading a photo failed with "new row
-- violates row-level security policy" even though the exact same authenticated
-- session, tested moments earlier via `rpc('is_admin')` through PostgREST, correctly
-- returned true.
--
-- Root cause: is_admin() (and the other three Phase 7 helper functions) are SECURITY
-- INVOKER (the default), and is_admin() internally queries `profiles`, which has its
-- own RLS. Evaluated through PostgREST, auth.uid() propagates correctly into that
-- nested query (via the Phase 6 self-read policy), so is_admin() returns true. Storage
-- is a separate service with its own connection/transaction handling for RLS
-- evaluation, and empirically does not propagate the same auth context into a NESTED
-- RLS check inside a SECURITY INVOKER function's body, even though the outer
-- auth.uid() call (used directly in a storage.objects policy) works fine — that's
-- exactly why the anon-vs-admin distinction on group-photos/student-photos still
-- worked (auth.uid() alone), but is_admin() specifically (which depends on a second,
-- nested RLS-governed lookup) silently evaluated false for a genuinely authenticated
-- admin.
--
-- Fix: SECURITY DEFINER. The function now runs with its owner's privileges, so its
-- internal `profiles` lookup no longer depends on the caller's RLS visibility into
-- that table — it only ever depends on auth.uid(), which is always available. This is
-- safe: the function is still fully self-referential (checks the CALLING user's own
-- role, using auth.uid() from their own JWT), so a definer-privileged internal lookup
-- can't be used to see or affect anything about any OTHER user. search_path was
-- already pinned to public in Phase 7 — mandatory here, not just best practice, since
-- an unpinned search_path on a SECURITY DEFINER function is a real privilege-escalation
-- vector (a malicious search_path could redirect an unqualified table reference).
--
-- Applied to all four Phase 7 helper functions, not just is_admin() — the same
-- nested-RLS-through-a-different-service class of bug could otherwise resurface
-- silently in Phase 15 (Realtime) or anywhere else these get evaluated outside a plain
-- PostgREST request.

create or replace function is_admin()
returns boolean
language sql
stable
security definer
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
security definer
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
security definer
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
security definer
set search_path = public
as $$
  select exists (
    select 1 from programs
    where id = p_program_id and status = 'published'
  );
$$;
