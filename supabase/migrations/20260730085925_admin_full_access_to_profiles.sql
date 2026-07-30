-- Gap found while building Phase 8's admin dashboard: profiles only ever got the
-- Phase 6 self-read policy ("authenticated users can read their own profile"). Every
-- other table got an admin FOR ALL policy in Phase 7 — this one should have too, and
-- was simply missed. Without it, an admin's own dashboard query for "how many judges
-- exist" sees only their own row (self-read), never anyone else's, and returns a
-- silently wrong count rather than an error.
--
-- Deliberately SELECT + UPDATE only, NOT the FOR ALL pattern every other table uses.
-- INSERT and DELETE on profiles are excluded on purpose: per D-006, account creation
-- goes through exactly one path — the (Phase 11) route handler using the service role
-- key, which creates the auth.users row and the profiles row together. Granting admin
-- a direct INSERT via RLS wouldn't break anything (the FK to auth.users still prevents
-- an orphaned row), but it would open a second, uncontrolled path to the same
-- operation, which is exactly what D-006 was trying to avoid. Account *deletion*
-- likewise isn't granted here — deleting a judge should go through the Auth Admin API
-- so the auth.users row and the profiles row (which cascades from it) are removed
-- together, not just the profile.

create policy "admin can read all profiles"
on profiles
for select
to authenticated
using (is_admin());

create policy "admin can update all profiles"
on profiles
for update
to authenticated
using (is_admin())
with check (is_admin());
