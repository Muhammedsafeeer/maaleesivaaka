-- Redesign: one ad = one sponsor, but an ad can carry MULTIPLE media items (photos
-- and/or videos) that cycle through its slot using the ad's own play/transition
-- duration settings — not "one ad per uploaded file", which is what the previous
-- single-media-column design (and the batch-create UI built on top of it) actually did.
-- Splits media into its own child table so an ad can have 0..N items instead of
-- exactly one.
--
-- The 10 existing `ads` rows are all test/debug rows from working through the earlier
-- upload-failure bugs (confirmed in conversation — none have media attached under the
-- old columns anyway) — cleared so ad_media starts clean rather than carrying orphaned
-- ad rows forward into the new model.
delete from ads;

alter table ads drop column media_type;
alter table ads drop column media_url;

-- text + check, not the ad_media_type enum from 20260806020000_ads.sql's original
-- text — that enum never actually landed on the remote (ads.media_type turned out to be
-- plain text there too, confirmed while debugging the earlier upload failures), so this
-- matches live reality instead of repeating the same drift.
create table ad_media (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references ads(id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  media_url text not null,
  position smallint not null,
  created_at timestamptz not null default now(),
  constraint ad_media_position_unique unique (ad_id, position) deferrable initially deferred
);

create index ad_media_ad_id_idx on ad_media (ad_id);

alter table ad_media enable row level security;

create policy "admin has full access to ad_media"
on ad_media
for all
to authenticated
using (is_admin())
with check (is_admin());

create policy "anyone can read ad_media"
on ad_media
for select
to anon, authenticated
using (true);
