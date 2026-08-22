-- Poster designer: one design PER CATEGORY instead of a single festival-wide design.
-- Admin-requested (Flutter app's Poster settings screen): "kids" posters should be
-- able to look different from "junior"/"senior"/etc — different background image,
-- different field layout/colors — printed automatically based on which category the
-- program being posted belongs to.
--
-- Backward-compatible with the existing website admin poster designer
-- (posterSettings.service.ts), which only ever reads/writes row id=1 and has no
-- category concept: row id=1 keeps category = null and becomes the "Default" design
-- — used as a fallback by the Flutter app for any category that somehow has no row of
-- its own (e.g. a brand-new category value added later). The website's designer
-- keeps working exactly as it does today, editing only that one "Default" row; it
-- just won't get the new per-category behavior unless it's updated separately.

alter table poster_settings drop constraint poster_settings_singleton;

alter table poster_settings add column category participant_category;

-- id was `smallint primary key default 1` for a singleton — still fine as a PK, but
-- new rows below need their own ids instead of all defaulting to 1 and colliding.
create sequence poster_settings_id_seq owned by poster_settings.id;
select setval('poster_settings_id_seq', 1, true);
alter table poster_settings alter column id set default nextval('poster_settings_id_seq');

alter table poster_settings add constraint poster_settings_category_unique unique (category);

-- Seed one row per known category, copying row id=1's current background/fields as a
-- starting template — an admin can then swap the background and re-lay-out fields
-- per category from the Flutter app without starting from a blank canvas.
insert into poster_settings (background_url, fields, category)
select p.background_url, p.fields, c.value::participant_category
from poster_settings p, (values ('kids'), ('sub_junior'), ('junior'), ('senior'), ('super_senior'), ('general')) as c(value)
where p.id = 1
on conflict (category) do nothing;
