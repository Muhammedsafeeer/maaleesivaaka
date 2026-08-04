-- Fixes the same bug 20260730130453_storage_select_policies.sql already diagnosed and
-- fixed for group-photos/student-photos: 20260806000000_certificate_settings.sql added
-- INSERT/UPDATE/DELETE policies for the certificate-assets bucket but no SELECT policy.
-- Storage's upload endpoint internally does an INSERT ... RETURNING, which is a real
-- SELECT-governed read under RLS executed as the `authenticated` role — with no SELECT
-- policy granting that implicit read, the whole INSERT rolled back with "new row
-- violates row-level security policy" even though the INSERT's own WITH CHECK passed.
-- Reproduced live: seal/signature uploads on /admin/settings failed with exactly that
-- error until this policy was added.

create policy "authenticated can read certificate assets"
on storage.objects
for select
to authenticated
using (bucket_id = 'certificate-assets');
