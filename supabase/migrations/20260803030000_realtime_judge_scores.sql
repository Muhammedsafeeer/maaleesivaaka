-- Same gap as 20260802000000_realtime_programs.sql / 20260802010000_realtime_program_judges.sql,
-- different table: the Fixture page's "who's performing now" roster (src/features/programs/components/ProgramRoster.tsx)
-- reads scoring progress from judge_scores directly, and a program's own `status` only
-- flips once ALL assigned students are fully scored — so useRealtimePrograms alone never
-- catches a single judge submitting one student's score mid-program. This turns on
-- postgres_changes for judge_scores so useRealtimeJudgeScores can pick it up live.
--
-- RLS already scopes judge_scores reads to "admin has full access" / a judge's own
-- submitted rows, so this doesn't widen access — an admin's realtime subscription
-- receives every row (same as their normal SELECT would), a judge's receives only theirs.

alter publication supabase_realtime add table judge_scores;
