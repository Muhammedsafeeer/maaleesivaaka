-- Certificate branding: signatory name + uploaded seal/signature images, configured once
-- in /admin/settings and stamped onto every printed certificate (CertificateTemplate,
-- src/features/certificates). Same singleton-row shape as score_settings — there is one
-- certificate design (public/certificate.jpeg) for the whole festival, not one per
-- program or student, so there is nothing to key this by.
--
-- Unlike score_settings, anon needs SELECT too: the audience "Find My Result" print
-- button (StudentSearchBar, /audience) prints a certificate from an unauthenticated
-- session, and it needs the same seal/signature/signatory name an admin-printed
-- certificate gets. This is safe to expose publicly — it's the organisation's own
-- branding (a seal image, a signature image, a name), not student data, so none of
-- D-017/D-019's house-only/lookup-only reasoning applies here.

create table certificate_settings (
  id smallint primary key default 1,
  signatory_name text not null default '',
  seal_url text,
  signature_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint certificate_settings_singleton check (id = 1)
);

insert into certificate_settings (id) values (1);

create trigger set_updated_at before update on certificate_settings
  for each row execute function set_updated_at();

alter table certificate_settings enable row level security;

create policy "admin has full access to certificate_settings"
on certificate_settings
for all
to authenticated
using (is_admin())
with check (is_admin());

create policy "anyone can read certificate_settings"
on certificate_settings
for select
to anon, authenticated
using (true);

-- Seal/signature image uploads — same public-bucket-with-admin-write-policy shape as
-- group-photos/student-photos (20260730092236_storage_buckets.sql), reusing PhotoUpload
-- (src/components/forms/PhotoUpload.tsx) with fixed entity keys ('seal' and 'signature')
-- rather than one row per entity, since there is only ever one of each.
-- 512000 (500 KB), matching MAX_PHOTO_SIZE_BYTES/src/constants/storage.ts directly (not
-- the original buckets' now-superseded 5 MB default) — see
-- 20260805010000_photo_buckets_500kb_limit.sql for why the bucket-level cap, not just
-- PhotoUpload's client-side compression, is the real boundary.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('certificate-assets', 'certificate-assets', true, 512000, array['image/jpeg', 'image/png', 'image/webp']);

create policy "admin can upload certificate assets"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'certificate-assets' and is_admin());

create policy "admin can update certificate assets"
on storage.objects
for update
to authenticated
using (bucket_id = 'certificate-assets' and is_admin())
with check (bucket_id = 'certificate-assets' and is_admin());

create policy "admin can delete certificate assets"
on storage.objects
for delete
to authenticated
using (bucket_id = 'certificate-assets' and is_admin());
