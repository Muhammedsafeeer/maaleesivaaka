-- Admin-requested: "dummy rows" in the Fixture running order for a break between
-- programs (tea break, prayer break, ...) — not a real program (no students, judges,
-- category, or scoring), but otherwise a first-class entry in the same running order:
-- draggable/reorderable alongside programs, and participates in the same "only one
-- entry on stage at a time" + "start the next queued entry" pipeline
-- (fixture.service.ts's startNextProgram/overrideProgramStatus, made cross-table-aware
-- in that same change). That pipeline is entirely admin-triggered TS code against
-- RLS — never the judge-facing finalize_program_results SQL function, which currently
-- has no auto-advance step of its own to extend.
--
-- Shares programs' own serial_number numbering space per stage_type (enforced by
-- application code, same as programs.serial_number itself — no cross-table DB
-- constraint) and a subset of program_status's vocabulary (upcoming/scoring/completed
-- only — never draft/published, which don't mean anything for a break).
create table fixture_breaks (
  id uuid primary key default gen_random_uuid(),
  stage_type stage_type not null,
  label text not null default 'Break',
  serial_number integer,
  status program_status not null default 'upcoming',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fixture_breaks_status_check check (status in ('upcoming', 'scoring', 'completed'))
);

create trigger set_updated_at before update on fixture_breaks
  for each row execute function set_updated_at();

alter table fixture_breaks enable row level security;

-- Admin-only — breaks are a Fixture-page scheduling aid, never read or written by a
-- judge session (unlike programs, which judges need read access to for their own
-- assignments) and never shown to the anonymous audience.
create policy "admin has full access to fixture_breaks"
on fixture_breaks
for all
to authenticated
using (is_admin())
with check (is_admin());
