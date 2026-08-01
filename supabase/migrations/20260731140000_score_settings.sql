-- Admin-configurable group leaderboard points (1st/2nd/3rd place), per docs/project.md
-- §Group Leaderboard: "These values should be configurable later" — anticipated in
-- constants/scoring.ts's own comment since Phase 5. Single-row table, not one row per
-- position: the podium is fixed at exactly three places (docs/project.md §Score
-- Submission lists only 1st/2nd/3rd), so there's no variable-length set to manage.
--
-- Seeded with the existing defaults (5/3/1) so behaviour is unchanged until an admin
-- actually edits it.

create table score_settings (
  id smallint primary key default 1,
  first_place_points smallint not null default 5 check (first_place_points >= 0),
  second_place_points smallint not null default 3 check (second_place_points >= 0),
  third_place_points smallint not null default 1 check (third_place_points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint score_settings_singleton check (id = 1)
);

insert into score_settings (id) values (1);

create trigger set_updated_at before update on score_settings
  for each row execute function set_updated_at();

alter table score_settings enable row level security;

create policy "admin has full access to score_settings"
on score_settings
for all
to authenticated
using (is_admin())
with check (is_admin());

-- finalizeIfComplete() (result.service.ts) reads this mid-request under the calling
-- judge's own session — it runs right after a judge submits scores, not only from the
-- admin's Recalculate button — so judges need read access too, same reasoning as
-- programs' judge-read policy.
create policy "judges can read score_settings"
on score_settings
for select
to authenticated
using (true);
