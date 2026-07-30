-- Phase 6 (Authentication) needs exactly one RLS policy before login can work at all:
-- an authenticated user must be able to read their OWN profiles row to know their role
-- and get redirected to the right place. RLS was enabled on every table in Phase 5 with
-- zero policies, deliberately, to fail closed — this is the one narrow exception,
-- scoped to "session management," not the broader admin/judge/audience data-access
-- policies Phase 7 adds for the other seven tables.
--
-- Deliberately SELECT-only and self-only: a user can read their own row, nothing else,
-- and cannot write to it at all (profile fields are managed by an admin, not the user).

create policy "users can read their own profile"
on profiles
for select
to authenticated
using (auth.uid () = id);
