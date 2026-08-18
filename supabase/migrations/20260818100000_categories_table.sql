-- D-022: move categories from a Postgres enum to a first-class table so admins
-- can create, rename, reorder, and delete them from the UI.
--
-- The existing participant_category enum stays on students/programs for now —
-- changing the column type on a live table with triggers and views referencing it
-- is a separate migration. This table is the new source of truth; the constants
-- file will read from it instead of a hardcoded list.

create table categories (
  id uuid primary key default gen_random_uuid(),
  value text not null unique,       -- slug stored on students/programs (e.g. 'kids')
  label text not null,              -- display name (e.g. 'Kids')
  malayalam_label text,             -- optional audience-facing label
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on categories
  for each row execute function set_updated_at();

alter table categories enable row level security;

create policy "admin has full access to categories"
on categories
for all
to authenticated
using (is_admin())
with check (is_admin());

create policy "anyone can read categories"
on categories
for select
to anon, authenticated
using (true);

-- Seed with the current enum values so the table matches what's already in use.
insert into categories (value, label, malayalam_label, sort_order) values
  ('kids',         'Kids',         'കിഡ്സ്',           1),
  ('sub_junior',   'Sub Junior',   'സബ് ജൂനിയർ',       2),
  ('junior',       'Junior',       'ജൂനിയർ',           3),
  ('senior',       'Senior',       'സീനിയർ',           4),
  ('super_senior', 'Super Senior', 'സൂപ്പർ സീനിയർ',     5),
  ('general',      'General',      'ജനറൽ',             6);
