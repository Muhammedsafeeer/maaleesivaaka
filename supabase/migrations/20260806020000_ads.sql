-- Audience-page ads: admin-managed posters/videos slotted into fixed gaps between the
-- /audience page's sections (utility bar, Leading Houses, Latest Winner, Now Performing,
-- Status of Festival, full standings, Category Highlights — see AD_SLOT_COUNT in
-- src/constants/ads.ts). `position` (1-based, drag-arranged in /admin/ads) selects which
-- gap an ad occupies; positions beyond the number of gaps simply have nowhere to render,
-- same as an unassigned row — no separate "active" flag needed for that.
--
-- Public SELECT: the audience page is unauthenticated (PUBLIC_ROUTES, src/constants/roles.ts)
-- and an ad is the organisation's own promotional content, not student data — none of
-- D-017/D-019's house-only/lookup-only reasoning applies, same call as certificate_settings
-- (20260806000000_certificate_settings.sql).

create type ad_media_type as enum ('image', 'video');

-- media_type/media_url are nullable: creating an ad and uploading its media are two
-- separate steps (AdFormDialog creates the row first, then uploads keyed by the new
-- row's id, then attaches the resulting URL) — same two-step shape as
-- main_groups.photo_url (Phase 9), for the same reason: the upload needs the row's id
-- as its Storage key, so the row has to exist first.
create table ads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  media_type ad_media_type,
  media_url text,
  -- Deferrable: reordering (drag-and-drop) updates every row's position inside one
  -- transaction, which would otherwise trip the unique constraint on the
  -- not-yet-fully-updated intermediate state.
  position smallint not null,
  play_duration_seconds smallint not null default 8 check (play_duration_seconds > 0),
  transition_duration_ms smallint not null default 500 check (transition_duration_ms >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ads_position_unique unique (position) deferrable initially deferred
);

create trigger set_updated_at before update on ads
  for each row execute function set_updated_at();

alter table ads enable row level security;

create policy "admin has full access to ads"
on ads
for all
to authenticated
using (is_admin())
with check (is_admin());

create policy "anyone can read ads"
on ads
for select
to anon, authenticated
using (true);

-- Public bucket, admin-only writes — same shape as group-photos/student-photos/
-- certificate-assets. 25 MB cap (vs. those buckets' 500 KB) because this bucket also
-- holds video files; PhotoUpload's client-side compression doesn't apply to ads (posters
-- are shown full-bleed, and video can't be compressed client-side at all), so the bucket
-- limit here is the only size boundary.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('ad-media', 'ad-media', true, 26214400, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']);

create policy "admin can upload ad media"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'ad-media' and is_admin());

create policy "admin can update ad media"
on storage.objects
for update
to authenticated
using (bucket_id = 'ad-media' and is_admin())
with check (bucket_id = 'ad-media' and is_admin());

create policy "admin can delete ad media"
on storage.objects
for delete
to authenticated
using (bucket_id = 'ad-media' and is_admin());

-- Drag-and-drop reordering (/admin/ads) needs every row's position updated together —
-- the supabase-js client has no way to batch several .update() calls into one
-- transaction, and without that, an in-place swap (e.g. 1<->2) would trip
-- ads_position_unique on the half-updated state even though the constraint is
-- deferrable (deferring only helps *within* a single transaction). This function is the
-- transaction: each row write still goes through the normal RLS policy above (not
-- security definer — a non-admin caller's updates simply match zero rows), so this adds
-- atomicity only, no privilege escalation.
create function reorder_ads(p_ids uuid[])
returns void
language plpgsql
as $$
declare
  i int;
begin
  for i in 1 .. array_length(p_ids, 1) loop
    update ads set position = i where id = p_ids[i];
  end loop;
end;
$$;

grant execute on function reorder_ads(uuid[]) to authenticated;
