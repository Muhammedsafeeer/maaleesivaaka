-- D-018 (docs/decisions.md): a narrow, explicitly-confirmed exception to D-017's
-- "audience never sees individual student names/photos" rule — scoped to exactly one
-- audience panel (the "Latest Winner" podium). The user was shown the consequence
-- (public, unauthenticated exposure of student identity/photos, including for the
-- "Kids" category) before confirming they want it anyway.
--
-- Only `name` and `photo_url` are added — roll_number, class, and gender stay
-- ungranted to anon, matching "the minimum needed for top-3-students-with-photos."
-- Every other anon-facing read in this app stays house/group-only; this grant widens
-- what ANY anonymous request can read from `students` (not just this one page's
-- queries), so keep it that narrow deliberately.

grant select (name, photo_url) on students to anon;
