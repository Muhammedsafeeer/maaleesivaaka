-- Roll numbers must be unique across all students. If this fails with a duplicate-key
-- error, some existing rows already share a roll number — find them first with:
--   select roll_number, count(*) from students group by roll_number having count(*) > 1;
-- and resolve the duplicates before re-running this migration.

alter table students add constraint students_roll_number_key unique (roll_number);
