-- Admin-requested toggle: normally a judge's scoring form locks the moment a program
-- flips to 'completed' (finalizeIfComplete's auto-transition), and submitScores/
-- submitTeamScores independently refuse anything but status = 'scoring'. When this
-- setting is on, a judge can keep revising their own scores for a program that's
-- 'completed' but not yet 'published' — e.g. they realize a mistake right after
-- finishing, without needing an admin to reopen the program via the Fixture page first.
-- Once a program is 'published' this never applies regardless of the setting — that
-- boundary is enforced in code (scoring.service.ts), not by this column.
--
-- Lives on score_settings (not a new table) — same singleton-row, festival-wide-toggle
-- shape as the points columns already there.

alter table score_settings
  add column allow_judge_rescore boolean not null default false;
