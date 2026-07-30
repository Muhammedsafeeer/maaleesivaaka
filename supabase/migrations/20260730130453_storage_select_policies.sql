-- Root cause of the Phase 9 upload bug, found via direct SQL reproduction (not
-- guesswork): storage.objects had ZERO SELECT policies. The original migration's
-- comment reasoned "both buckets are public, so SELECT is already open to everyone —
-- Supabase serves public-bucket objects without consulting storage.objects RLS at
-- all." That's true only for the dedicated public-serving endpoint
-- (/storage/v1/object/public/...), which does bypass table RLS. It is NOT true for a
-- normal authenticated-role table operation — and Storage's own upload endpoint
-- internally does an INSERT ... RETURNING (to hand the created object's metadata back
-- to the caller), which is a real SELECT-governed read under RLS, executed as the
-- `authenticated` role, not through the public-serving bypass. With no SELECT policy
-- for `authenticated`, that implicit read had nothing granting it, so the entire
-- INSERT rolled back with "new row violates row-level security policy" — even though
-- the INSERT's own WITH CHECK correctly evaluated true.
--
-- Confirmed by direct reproduction: `insert into storage.objects (...) returning id`
-- failed under a simulated authenticated+admin session; adding a temporary SELECT
-- policy made the identical statement succeed immediately.
--
-- Fix: unconditional SELECT for `authenticated` on both buckets — not gated by
-- is_admin(), since these are PUBLIC buckets (D-012) and any authenticated session
-- (admin or judge) performing a write needs its own implicit read-back to succeed, not
-- just admin's. No anon SELECT policy needed: anonymous public reads already work
-- correctly through the dedicated public-serving endpoint, verified live in the
-- original Phase 9 migration's testing (a GET on a public object returns a clean 404
-- for a missing file, not a permission error — proving that path never needed
-- table-level RLS in the first place).

create policy "authenticated can read group photos"
on storage.objects
for select
to authenticated
using (bucket_id = 'group-photos');

create policy "authenticated can read student photos"
on storage.objects
for select
to authenticated
using (bucket_id = 'student-photos');
