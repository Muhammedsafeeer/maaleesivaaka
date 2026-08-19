-- Admin-requested: push a specific ad into the /tv slideshow rotation, independent of
-- its /audience slot assignment (an ad's `position` still only controls its /audience
-- gap — see 20260806020000_ads.sql — pushing it to TV is a separate, additive choice,
-- not a replacement for that). No RLS change needed: "anyone can read ads" (that same
-- migration) already grants anon full read, which /tv relies on the same way /audience
-- already does.

alter table ads add column show_on_tv boolean not null default false;
