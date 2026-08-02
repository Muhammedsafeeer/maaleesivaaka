-- Roll numbers only need to be unique within a class, not across the whole school —
-- two students in different classes can share a roll number. Replaces the whole-table
-- constraint from 20260803000000_students_roll_number_unique.sql.
--
-- If this fails with a duplicate-key error, some existing rows already share a
-- (class, roll_number) pair — find them first with:
--   select class, roll_number, count(*) from students
--   group by class, roll_number having count(*) > 1;
-- and resolve the duplicates before re-running this migration.

alter table students drop constraint students_roll_number_key;
alter table students add constraint students_class_roll_number_key unique (class, roll_number);
