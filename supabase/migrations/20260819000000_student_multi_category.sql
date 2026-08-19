-- D-024: students can hold multiple categories.
-- See docs/decisions.md D-024. Replaces the single participant_category column on
-- students with a student_categories join table. programs.category is unaffected —
-- only students go multi-category; a program still targets exactly one category.

create table student_categories (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students (id) on delete cascade,
  category participant_category not null,
  created_at timestamptz not null default now(),
  unique (student_id, category)
);

create index student_categories_category_idx on student_categories (category);

alter table student_categories enable row level security;

create policy "admin has full access to student_categories"
on student_categories
for all
to authenticated
using (is_admin())
with check (is_admin());

create policy "judges can read categories for students in their programs"
on student_categories
for select
to authenticated
using (
  exists (
    select 1 from program_students ps
    where ps.student_id = student_categories.student_id
      and is_judge_assigned_to_program(ps.program_id)
  )
);

-- Backfill: every existing student keeps their current category...
insert into student_categories (student_id, category)
select id, category from students
on conflict do nothing;

-- ...and every existing student additionally gets 'general' (D-024: existing students
-- couldn't do General programs at all before this migration, and the ask was "all
-- students can also perform in general" — so this one-time backfill grants it. New
-- students created after this migration do NOT auto-get General; an admin ticks it
-- explicitly like any other category).
insert into student_categories (student_id, category)
select id, 'general'::participant_category from students
on conflict do nothing;

drop trigger enforce_category_match on program_students;
drop index students_category_idx;
alter table students drop column category;

-- Rewritten from D-007's exact-equality check to a membership check against
-- student_categories.
create or replace function enforce_student_program_category_match()
returns trigger
language plpgsql
as $$
declare
  v_program_category participant_category;
begin
  select category into v_program_category from programs where id = new.program_id;

  if not exists (
    select 1 from student_categories
    where student_id = new.student_id and category = v_program_category
  ) then
    raise exception 'category_mismatch: student is not in program category (%)',
      v_program_category
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger enforce_category_match
  before insert or update on program_students
  for each row execute function enforce_student_program_category_match();
