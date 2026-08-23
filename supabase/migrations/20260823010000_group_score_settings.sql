-- Admin-requested: a group (team) program's podium should be able to award different
-- points than an individual program's — e.g. a group event might traditionally count
-- for more since only one team per house can win it, versus many individual entries.
-- Same singleton row, three more columns rather than a second table: still exactly one
-- admin-configured points scheme per program shape, same "podium is fixed at three
-- places" reasoning as the original 20260731140000 migration.
--
-- Seeded with the same 5/3/1 defaults as the individual columns, so behaviour is
-- unchanged (group and individual programs award identical points) until an admin
-- actually edits the group values apart from the individual ones.

alter table score_settings
  add column group_first_place_points smallint not null default 5 check (group_first_place_points >= 0),
  add column group_second_place_points smallint not null default 3 check (group_second_place_points >= 0),
  add column group_third_place_points smallint not null default 1 check (group_third_place_points >= 0);
