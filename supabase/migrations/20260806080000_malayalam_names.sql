-- Malayalam-script names alongside each entity's existing (English/roman-script) name
-- — captured now so the poster/certificate features can be updated later to print the
-- Malayalam name (this event is in Kerala; PRODUCT.md/audience banner are Malayalam-
-- context). Nullable on all three: existing rows have no Malayalam name yet, and
-- filling it in isn't required to create a group/program/student.

alter table main_groups add column malayalam_name text;
alter table programs add column malayalam_name text;
alter table students add column malayalam_name text;
