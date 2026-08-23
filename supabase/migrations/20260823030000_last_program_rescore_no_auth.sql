-- Admin-requested, a second and separate toggle from allow_judge_rescore
-- (20260823020000): normally revising a score a judge already submitted always
-- requires an admin password (submitScores/submitTeamScores' changesExistingScore
-- check), regardless of program status. When this is on, a judge can freely revise
-- scores for their own MOST RECENTLY submitted program — no password — since that's
-- almost always "I just noticed a typo," not a dispute needing oversight. Any OTHER,
-- earlier program they've scored still requires admin authorization to change,
-- whether this is on or off.

alter table score_settings
  add column allow_last_program_rescore_without_auth boolean not null default false;
