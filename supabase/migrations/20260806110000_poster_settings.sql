-- Poster designer: a single admin-uploaded background image plus a JSON list of
-- placeable field markers (program name, category, per-podium-position winner
-- name/group/photo/points, and a static footer line), each carrying its own x/y
-- position (fractions of the background's width/height, resolution-independent),
-- font size, color, weight, alignment, and visibility. Configured once in the new
-- Flutter admin app's Poster settings screen; the Poster list screen then renders one
-- populated poster per published program using this shared layout and captures it to
-- an image on-device (no server-side rendering — same "client renders, no image
-- pipeline" choice the web app's results-poster/certificates features already made,
-- just via Flutter's RepaintBoundary instead of html2canvas).
--
-- Singleton row, same shape as certificate_settings/score_settings — there is one
-- poster design for the whole festival, not one per program.
--
-- Unlike certificate_settings, there is no public/anon SELECT policy here: the poster
-- feature is an admin-only tool (list published programs, generate/share an image),
-- never rendered from an unauthenticated session the way certificate printing is from
-- the audience page's "Find My Result" — so admin-only RLS is the correct, narrower
-- default.
create table poster_settings (
  id smallint primary key default 1,
  background_url text,
  -- Array of {key, label, type ('text'|'photo'), x, y, fontSize, photoSize, color,
  -- bold, align, visible} — validated client-side (Flutter), not constrained here,
  -- same "jsonb, no server-side shape enforcement" choice as judge_scores.criteria_scores.
  fields jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint poster_settings_singleton check (id = 1)
);

insert into poster_settings (id) values (1);

create trigger set_updated_at before update on poster_settings
  for each row execute function set_updated_at();

alter table poster_settings enable row level security;

create policy "admin has full access to poster_settings"
on poster_settings
for all
to authenticated
using (is_admin())
with check (is_admin());

-- Public bucket (so a captured poster's constituent images load in the app without an
-- auth header, same as every other photo bucket), admin-only writes. 5 MB cap — a
-- poster background is shown full-bleed like an ad, not compressed client-side like
-- PhotoUpload's student/group photos, so this needs more headroom than those 500 KB
-- buckets.
--
-- Includes the "authenticated can read" SELECT policy from the start, not as a
-- follow-up fix: 20260806010000_certificate_assets_select_policy.sql's comment
-- documents the exact bug this avoids — Storage's upload endpoint does an
-- INSERT ... RETURNING internally, which needs a SELECT policy to succeed under RLS
-- even though the INSERT's own WITH CHECK already passed.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('poster-assets', 'poster-assets', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "admin can upload poster assets"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'poster-assets' and is_admin());

create policy "admin can update poster assets"
on storage.objects
for update
to authenticated
using (bucket_id = 'poster-assets' and is_admin())
with check (bucket_id = 'poster-assets' and is_admin());

create policy "admin can delete poster assets"
on storage.objects
for delete
to authenticated
using (bucket_id = 'poster-assets' and is_admin());

create policy "authenticated can read poster assets"
on storage.objects
for select
to authenticated
using (bucket_id = 'poster-assets');
