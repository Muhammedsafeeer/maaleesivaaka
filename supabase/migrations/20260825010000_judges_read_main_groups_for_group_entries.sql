-- Bug fix: the judge scoring window shows "Unknown house" for every team in a group
-- program (e.g. Muhiyudheen Maala).
--
-- 20260730082605_rls_policies.sql deliberately gave judges NO read policy on
-- main_groups, to keep individual-program scoring blind to which house a student
-- represents. That's fine for individual programs (their scoring UI never joins
-- main_groups at all), but D-025 follow-up's group scoring
-- (scoring.service.ts's listScorableTeams) explicitly joins
-- `program_group_entries.main_groups(name)` to label each team — the whole point of a
-- group program is that one house's team performs together on stage, so there's no
-- anonymity to preserve there. Judges already have a read policy on
-- program_group_entries itself (20260819010000) exposing group_id; without a matching
-- main_groups policy that id could never be resolved to a name, so every entry fell
-- back to listScorableTeams' "Unknown house" default.
--
-- Fix: let a judge read a main_groups row only when it has a team entry in a program
-- they're assigned to — narrower than "judges can read all houses," but enough to
-- resolve every name listScorableTeams needs.

create policy "judges can read main_groups for their assigned group programs"
on main_groups
for select
to authenticated
using (
  exists (
    select 1 from program_group_entries pge
    where pge.group_id = main_groups.id
      and is_judge_assigned_to_program(pge.program_id)
  )
);
