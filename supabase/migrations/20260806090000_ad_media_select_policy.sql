-- Every ad-media upload has still been failing with "new row violates row level
-- security policy" even after 20260806050000 repaired the INSERT/UPDATE/DELETE
-- policies. Root cause: storage.objects has no SELECT policy for the 'ad-media'
-- bucket at all (unlike group-photos/student-photos/certificate-assets, which each
-- have an "authenticated can read ..." policy) — whoever wrote 20260806020000 relied
-- on the bucket's public=true flag to cover reads, which is enough for the public
-- getPublicUrl() download path, but Supabase's Storage upload endpoint reads the row
-- back after inserting it (an implicit RETURNING), and Postgres requires that
-- returned row to satisfy a SELECT policy too. With none, every upload's INSERT was
-- rejected by RLS regardless of the (correct) INSERT policy or admin status.

create policy "authenticated can read ad media"
on storage.objects
for select
to authenticated
using (bucket_id = 'ad-media');
