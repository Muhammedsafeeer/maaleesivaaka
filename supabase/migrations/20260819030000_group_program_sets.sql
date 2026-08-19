-- D-025 follow-up: multiple sets per house within one group program.
--
-- Context: a house can field more than one team in the same group program (e.g. Group A
-- performs two separate group-dance sets with different members), each scored
-- independently. The scoring/results plumbing added in 20260819020000 already supports
-- this correctly — judge_scores/results are keyed by group_entry_id, one row per TEAM
-- ENTRY, never per house — so scoring itself needs zero changes here. The real gaps:
--
-- 1. program_group_entries only allowed ONE entry per (program, house) —
--    unique(program_id, group_id) — so a second set for the same house couldn't be
--    created at all.
-- 2. program_students had no link to WHICH entry a member belongs to; membership was
--    inferred purely by matching the student's house to the entry's house
--    (GroupRosterPanel: `assignedStudents.filter(s => s.group_id === entry.group_id)`).
--    That's ambiguous the moment a house has more than one entry — every member from
--    that house would show up under every one of its sets.

-- ============================================================================
-- program_group_entries: allow multiple entries per house, numbered as "sets".
-- ============================================================================

alter table program_group_entries drop constraint if exists program_group_entries_program_id_group_id_key;
alter table program_group_entries add column set_number smallint not null default 1;
alter table program_group_entries
  add constraint program_group_entries_program_group_set_unique unique (program_id, group_id, set_number);

-- ============================================================================
-- program_students: which set/entry a group-program member belongs to. Null for
-- individual-program rows always; required (enforced by the trigger below) for group-
-- program rows going forward.
-- ============================================================================

alter table program_students
  add column group_entry_id uuid references program_group_entries (id) on delete set null;

create index program_students_group_entry_id_idx on program_students (group_entry_id);

-- One-time backfill: every existing group-program assignment predates the multi-set
-- feature, so it always belonged to its house's single (now "set 1") entry.
update program_students ps
set group_entry_id = pge.id
from programs p, students s, program_group_entries pge
where ps.program_id = p.id
  and p.participation_type = 'group'
  and ps.student_id = s.id
  and pge.program_id = ps.program_id
  and pge.group_id = s.group_id
  and ps.group_entry_id is null;

-- ============================================================================
-- D-007/D-024/D-025 trigger: a group-program assignment must now name the specific
-- set/entry it belongs to, not just "some entry exists for this student's house".
-- ============================================================================

create or replace function enforce_student_program_category_match()
returns trigger
language plpgsql
as $$
declare
  v_program_category participant_category;
  v_participation_type participation_type;
  v_student_group_id uuid;
begin
  select category, participation_type into v_program_category, v_participation_type
  from programs where id = new.program_id;

  if not exists (
    select 1 from student_categories
    where student_id = new.student_id and category = v_program_category
  ) then
    raise exception 'category_mismatch: student is not in program category (%)',
      v_program_category
      using errcode = '23514';
  end if;

  if v_participation_type = 'group' then
    if new.group_entry_id is null then
      raise exception 'group_entry_missing: a group program assignment must specify which team/set the student belongs to'
        using errcode = '23514';
    end if;

    select group_id into v_student_group_id from students where id = new.student_id;

    if not exists (
      select 1 from program_group_entries
      where id = new.group_entry_id
        and program_id = new.program_id
        and group_id = v_student_group_id
    ) then
      raise exception 'group_entry_mismatch: the selected team/set does not belong to this program or this student''s house'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;
