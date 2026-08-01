-- Same gap as 20260802000000_realtime_programs.sql, different table: an admin
-- assigning or unassigning a judge from a program writes program_judges, not programs,
-- so RealtimeProgramsListener alone never caught it — a judge's dashboard only picked
-- up a new/removed assignment on a manual refresh. This turns on postgres_changes for
-- program_judges so useRealtimeProgramJudges can pick it up live.
--
-- RLS already scopes program_judges reads to "judges can read their own assignment
-- rows" (judge_id = auth.uid()), so this doesn't widen access — a judge's realtime
-- subscription only ever receives events for their own assignment rows, same as a
-- normal SELECT would return.

alter publication supabase_realtime add table program_judges;
