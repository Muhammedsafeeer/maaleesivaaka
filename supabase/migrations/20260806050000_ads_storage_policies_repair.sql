-- Every ad-media upload has been failing (10 orphaned `ads` rows with media_url still
-- null, created fine via the admin-gated table policy — confirming that policy landed —
-- but never getting media attached). Same root cause pattern as
-- 20260806030000_ads_reorder_function.sql: the original 20260806020000 push was
-- interrupted partway, and the three storage.objects policies for the 'ad-media' bucket
-- (which come right after the bucket insert, before reorder_ads) most likely never
-- landed — leaving no INSERT policy for authenticated users, so every upload was
-- rejected by RLS regardless of admin status. Re-creating them is a no-op if they
-- already exist.

drop policy if exists "admin can upload ad media" on storage.objects;
create policy "admin can upload ad media"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'ad-media' and is_admin());

drop policy if exists "admin can update ad media" on storage.objects;
create policy "admin can update ad media"
on storage.objects
for update
to authenticated
using (bucket_id = 'ad-media' and is_admin())
with check (bucket_id = 'ad-media' and is_admin());

drop policy if exists "admin can delete ad media" on storage.objects;
create policy "admin can delete ad media"
on storage.objects
for delete
to authenticated
using (bucket_id = 'ad-media' and is_admin());
