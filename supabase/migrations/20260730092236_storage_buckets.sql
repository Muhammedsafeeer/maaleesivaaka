-- Phase 9: Storage buckets for group and student photos (docs/project.md "File
-- Storage", docs/agents.md "Storage" — files never in the database, only URLs, which
-- is exactly what main_groups.photo_url / students.photo_url (Phase 5) are for).
--
-- Both buckets are PUBLIC — confirmed with the user this phase. D-010 (Phase 7)
-- restricted anonymous access to student data at the table level (id/group_id only,
-- no PII); the consistent extension would have been a private student-photos bucket
-- with signed URLs. The user explicitly chose the simpler both-public option instead,
-- after that tradeoff was raised. Recorded as D-012 in docs/decisions.md.
--
-- File validation ("architecture.md §18: Storage Security") is enforced at the bucket
-- level via file_size_limit and allowed_mime_types — Postgres/Storage rejects an
-- oversized or wrong-type upload before it ever reaches the bucket, not just the
-- client-side form. 5 MB and jpeg/png/webp are the assistant's defaults; no doc
-- specifies either.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('group-photos', 'group-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('student-photos', 'student-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

-- Both buckets are public, so SELECT is already open to everyone (including anon) —
-- Supabase serves public-bucket objects without consulting storage.objects RLS at all.
-- Only writes need policies here.

create policy "admin can upload group photos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'group-photos' and is_admin());

create policy "admin can update group photos"
on storage.objects
for update
to authenticated
using (bucket_id = 'group-photos' and is_admin())
with check (bucket_id = 'group-photos' and is_admin());

create policy "admin can delete group photos"
on storage.objects
for delete
to authenticated
using (bucket_id = 'group-photos' and is_admin());

create policy "admin can upload student photos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'student-photos' and is_admin());

create policy "admin can update student photos"
on storage.objects
for update
to authenticated
using (bucket_id = 'student-photos' and is_admin())
with check (bucket_id = 'student-photos' and is_admin());

create policy "admin can delete student photos"
on storage.objects
for delete
to authenticated
using (bucket_id = 'student-photos' and is_admin());
