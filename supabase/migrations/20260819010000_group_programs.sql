-- D-025: group (team) programs with a shared per-house chest number.
-- See docs/decisions.md D-025. Every program was implicitly "individual" before this —
-- one student per program_students row, identified by their own personal roll_number.
-- A group program is a team event: several students from the same house perform
-- together as one entry, identified by ONE chest number shared by the whole team.
-- Scoring/results/certificates are unaffected — still per (program_id, student_id).

create type participation_type as enum ('individual', 'group');

alter table programs
  add column participation_type participation_type not null default 'individual';

create table program_group_entries (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs (id) on delete cascade,
  group_id uuid not null references main_groups (id) on delete restrict,
  chest_number text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, group_id),
  unique (program_id, chest_number)
);

create index program_group_entries_program_id_idx on program_group_entries (program_id);

create trigger set_updated_at before update on program_group_entries
  for each row execute function set_updated_at();

alter table program_group_entries enable row level security;

create policy "admin has full access to program_group_entries"
on program_group_entries
for all
to authenticated
using (is_admin())
with check (is_admin());

create policy "judges can read group entries for their assigned programs"
on program_group_entries
for select
to authenticated
using (is_judge_assigned_to_program(program_id));

create policy "anon can read program_group_entries"
on program_group_entries
for select
to anon
using (true);

-- Extends the D-024 category-membership trigger: for a group program, a student can
-- only be added to program_students if their house already has a team entry for this
-- program (created via program_group_entries first).
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
    select group_id into v_student_group_id from students where id = new.student_id;

    if not exists (
      select 1 from program_group_entries
      where program_id = new.program_id and group_id = v_student_group_id
    ) then
      raise exception 'group_entry_missing: no team entry exists for this student''s house in this program'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;
